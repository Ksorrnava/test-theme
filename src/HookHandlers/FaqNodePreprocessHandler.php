<?php

namespace Drupal\elfbv\HookHandlers;

use Drupal\Core\Datetime\DrupalDateTime;
use Drupal\Core\DependencyInjection\ContainerInjectionInterface;
use Drupal\Core\StringTranslation\StringTranslationTrait;
use Drupal\elfbv_global\HookHandlers\IsApplicableInterface;
use Drupal\statistics\StatisticsViewsResult;
use Drupal\taxonomy\TermInterface;
use Symfony\Component\DependencyInjection\ContainerInterface;

/**
 * Preprocess handler for node with type "business".
 */
class FaqNodePreprocessHandler implements IsApplicableInterface {

  use StringTranslationTrait;

  /**
   * Is applicable bundle for this preprocess.
   */
  const BUNDLE_ID = 'faq';

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
    /** @var \Drupal\elfbv_user\Entity\User $author */
    $author = $this->entity->getOwner();
    $variables['author'] = [
      'username' => $author->getAccountName(),
      'user_image' => $author->get('user_picture')->view('default'),
      'user_link' => $author->toUrl()->toString(),
    ];

    $date = DrupalDateTime::createFromTimestamp($this->entity->getCreatedTime());
    $variables['date'] = $date->format('d/m/Y, H:i');

    $category = $this->entity->getCategory();
    if ($category instanceof TermInterface) {
      $variables['category_title'] = $category->getName();
    }

    $variables['node_type'] = $this->t('FAQ');
    // todo: Find a way to use DI.
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
