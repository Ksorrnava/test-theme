<?php

namespace Drupal\elfbv\HookHandlers;

use Drupal\Core\Datetime\DrupalDateTime;
use Drupal\Core\Datetime\DateFormatterInterface;
use Drupal\Core\Routing\CurrentRouteMatch;
use Drupal\Core\Security\TrustedCallbackInterface;
use Drupal\Core\Session\AccountProxyInterface;
use Drupal\Core\StringTranslation\StringTranslationTrait;
use Drupal\Core\Url;
use Drupal\elfbv_global\HookHandlers\IsApplicableInterface;
use Drupal\statistics\StatisticsStorageInterface;
use Drupal\statistics\StatisticsViewsResult;
use Drupal\taxonomy\TermInterface;
use Symfony\Component\DependencyInjection\ContainerInterface;

/**
 * Preprocess handler for node with type "forum".
 */
class ForumNodePreprocessHandler implements IsApplicableInterface, TrustedCallbackInterface {

  use StringTranslationTrait;

  /**
   * Is applicable bundle for this preprocess.
   */
  const BUNDLE_ID = 'forum';

  /**
   * The preprocessed entity.
   *
   * @var \Drupal\elfbv_forum\Entity\ForumNodeInterface
   */
  protected $entity;

  /**
   * Constructs Discussion preprocess.
   *
   * @param \Drupal\statistics\StatisticsStorageInterface $statisticsStorage
   *   Statistics storage.
   * @param \Drupal\Core\Session\AccountProxyInterface $currentUser
   *   Current user.
   * @param \Drupal\Core\Routing\CurrentRouteMatch $currentRouteMatch
   *   Current Route match.
   */
  public function __construct(
    protected StatisticsStorageInterface $statisticsStorage,
    protected AccountProxyInterface $currentUser,
    protected CurrentRouteMatch $currentRouteMatch,
    protected DateFormatterInterface $dateFormatter,
  ) {}

  /**
   * {@inheritDoc}
   */
  public static function create(ContainerInterface $container) {
    return new static(
      $container->get('statistics.storage.node'),
      $container->get('current_user'),
      $container->get('current_route_match'),
      $container->get('date.formatter')
    );
  }

  /**
   * Preprocess function for node with type "forum".
   *
   * @param array $variables
   *   An associative array.
   */
  public function preprocess(array &$variables): void {
    if (!$leaf = $variables['node']->get('leaf')->entity) {
      return;
    }

    if (!$leaf->isPublished() || $leaf->isRoot()) {
      return;
    }

    $variables['topic_comments_count'] = $this->entity->getCommentsCount() ?? 0;
    /** @var \Drupal\elfbv_user\Entity\User $author */
    $author = $this->entity->getOwner();
    $request_time = (int) \Drupal::time()->getRequestTime();
    $variables['topic_author'] = [
      'username' => $author->getAccountName(),
      'user_image' => $author->get('user_picture')->view('default'),
      'user_link' => $author->toUrl()->toString(),
    ];
    $author_created = $author->getCreatedTime();
    $variables['topic_author_joined'] = $this->dateFormatter->formatInterval($request_time - $author_created, 1);

    $node_created = $this->entity->getCreatedTime();
    $topic_date = DrupalDateTime::createFromTimestamp($node_created);
    $variables['topic_date'] = $topic_date->format('d/m/Y, H:i');
    $variables['topic_date_footer'] = $this->formatTopicDateFooter($request_time, $node_created);
    $variables['is_new'] = ($request_time - $node_created) <= 48 * 3600;

    $comments_count = (int) ($variables['topic_comments_count'] ?? 0);
    $variables['topic_comments_count_label'] = $this->formatPlural(
      $comments_count,
      '1 комментарий',
      '@count комментариев',
      ['@count' => $comments_count]
    )->render();

    $forum_category = $this->entity->get('leaf_category')->entity;
    /** @var \Drupal\elfbv_leaf\LeafInterface $leaf */
    $leaf_id = $leaf->id();

    if ($forum_category instanceof TermInterface) {
      // @todo Move into widget or template.
      $variables['topic_category'] = [
        'title' => $forum_category->label(),
        'term_id' => $forum_category->id(),
        'url' => Url::fromRoute("leaf.$leaf_id.forum.category_page", [
          'leaf' => substr($leaf->getAlias(), 1),
          'category' => $forum_category->get('category_path')->value,
        ])->toString(),
        // @phpstan-ignore-next-line
        'icon' => $forum_category->select_icon?->view('default'),
      ];
    }

    // @phpstan-ignore-next-line
    if ($author->id() === $this->currentUser->id() && !$this->entity->in_preview) {
      $variables['node_edit'] = Url::fromRoute("leaf.$leaf_id.forum.edit", [
        'leaf' => substr($leaf->getAlias(), 1),
        // @phpstan-ignore-next-line
        'category' => $forum_category->get('category_path')->value,
        'node' => $variables['node']->id(),
      ])->toString();
    }

    $variables['node_type'] = $this->t('Forum');

    $variables['view_total_count'] = [
      '#lazy_builder' => [
        '\Drupal\elfbv\HookHandlers\ForumNodePreprocessHandler::buildViewTotalCount',
        [$variables['node']->id()],
      ],
      '#create_placeholder' => TRUE,
    ];
  }

  /**
   * Lazy builder for the view total count element.
   *
   * @param string $nid
   *   Node id.
   *
   * @return array
   *   Render array.
   */
  public static function buildViewTotalCount(string $nid):array {
    $counter = \Drupal::service('statistics.storage.node')->fetchView($nid);

    if ($counter instanceof StatisticsViewsResult) {
      return [
        '#markup' => $counter->getTotalCount(),
        '#cache' => ['max-age' => 0],
      ];
    }
    else {
      return [
        '#markup' => '0',
        '#cache' => ['max-age' => 0],
      ];
    }

  }

  /**
   * Formats topic date for footer: "Сегодня, 11:24", "Вчера, 09:57" or "15 декабря, 15:44".
   *
   * @param int $request_time
   *   Current request timestamp.
   * @param int $node_created
   *   Node created timestamp.
   *
   * @return string
   *   Formatted date string.
   */
  protected function formatTopicDateFooter(int $request_time, int $node_created): string {
    $node_ymd = date('Y-m-d', $node_created);
    $today_ymd = date('Y-m-d', $request_time);
    $yesterday_ymd = date('Y-m-d', $request_time - 86400);
    $time = $this->dateFormatter->format($node_created, 'custom', 'H:i', NULL);
    if ($node_ymd === $today_ymd) {
      return $this->t('Сегодня, @time', ['@time' => $time]);
    }
    if ($node_ymd === $yesterday_ymd) {
      return $this->t('Вчера, @time', ['@time' => $time]);
    }
    return $this->dateFormatter->format($node_created, 'custom', 'd F, H:i', NULL);
  }

  /**
   * {@inheritdoc}
   */
  public function isApplicable(mixed $object = NULL): bool {
    if (isset($object['node'])) {
      /** @var \Drupal\node\NodeInterface $node */
      $node = $object['node'];
      if ($node->bundle() == self::BUNDLE_ID) {
        /** @var \Drupal\elfbv_forum\Entity\ForumNodeInterface $node */
        $this->entity = $node;

        return TRUE;
      }
    }

    return FALSE;
  }

  /**
   * {@inheritDoc}
   */
  public static function trustedCallbacks():array {
    return ['buildViewTotalCount'];
  }

}
