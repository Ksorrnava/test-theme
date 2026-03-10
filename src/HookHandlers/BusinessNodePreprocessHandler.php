<?php

namespace Drupal\elfbv\HookHandlers;

use Drupal\Core\Datetime\DrupalDateTime;
use Drupal\Core\StringTranslation\StringTranslationTrait;
use Drupal\Core\Url;
use Drupal\elfbv_global\HookHandlers\IsApplicableInterface;
use Drupal\statistics\StatisticsViewsResult;
use Drupal\taxonomy\TermInterface;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

/**
 * Preprocess handler for node with type "business".
 */
class BusinessNodePreprocessHandler implements IsApplicableInterface {

  use StringTranslationTrait;

  /**
   * Is applicable bundle for this preprocess.
   */
  const BUNDLE_ID = 'business';

  /**
   * The preprocessed entity.
   *
   * @var \Drupal\elfbv_forum\Entity\BusinessNodeInterface
   */
  protected $entity;

  /**
   * Entity view builder service.
   *
   * @var \Drupal\Core\Entity\EntityViewBuilderInterface
   */
  private $entityViewBuilder;

  /**
   * {@inheritdoc}
   */
  public static function create(ContainerInterface $container) {
    $instance = new static();
    $instance->entityViewBuilder = $container->get('entity_type.manager')
      ->getViewBuilder('node');

    return $instance;
  }

  /**
   * Preprocess function for node with type "business".
   *
   * @param array $variables
   *   An associative array.
   */
  public function preprocess(array &$variables): void {
    if (!$leaf = $variables['node']->get('leaf')->entity) {
      return;
    }

    if (!$leaf->isPublished()) {
      throw new NotFoundHttpException();
    }

    $variables['comments_count'] = $this->entity->getCommentsCount() ?? 0;
    /** @var \Drupal\elfbv_user\Entity\User $author */
    $author = $this->entity->getOwner();
    $variables['author'] = [
      'username' => $author->getAccountName(),
      'user_image' => $author->get('user_picture')->view('default'),
      'user_link' => $author->toUrl()->toString(),
    ];

    $date = DrupalDateTime::createFromTimestamp($this->entity->getCreatedTime());
    $variables['date'] = $date->format('d/m/Y, H:i');

    $category = $this->entity->get('leaf_category')->entity;
    /** @var \Drupal\elfbv_leaf\LeafInterface $leaf */
    $leaf_id = $leaf->id();

    if ($category instanceof TermInterface) {
      $variables['category'] = [
        'title' => $category->label(),
        'term_id' => $category->id(),
        'url' => Url::fromRoute("leaf.$leaf_id.business.category_page", [
          'leaf' => substr($leaf->getAlias(), 1),
          'business_category' => $category->get('category_path')->value,
        ])->toString(),
        // @phpstan-ignore-next-line
        'icon' => $category->select_icon?->view('default'),
      ];
    }

    $variables['contacts'] = $this->entityViewBuilder->view($this->entity, 'contacts');
    $variables['node_type'] = $this->t('Business');
    // @todo Find a way to use DI.
    // @phpstan-ignore-next-line
    $counter = \Drupal::service('statistics.storage.node')->fetchView($variables['node']->id());

    if ($counter instanceof StatisticsViewsResult) {
      $variables['view_total_count'] = $counter->getTotalCount();
    }
  }

  /**
   * {@inheritdoc}
   */
  public function isApplicable(mixed $object = NULL): bool {
    if (isset($object['node'])) {
      $node = $object['node'];
      if ($node->bundle() == self::BUNDLE_ID) {
        /** @var \Drupal\elfbv_forum\Entity\BusinessNodeInterface $node */
        $this->entity = $node;

        return TRUE;
      }
    }

    return FALSE;
  }

}
