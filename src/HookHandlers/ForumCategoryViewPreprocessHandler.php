<?php

namespace Drupal\elfbv\HookHandlers;

use Drupal\Core\Block\BlockPluginInterface;
use Drupal\Core\DependencyInjection\ContainerInjectionInterface;
use Drupal\elfbv_global\HookHandlers\IsApplicableInterface;
use Symfony\Component\DependencyInjection\ContainerInterface;

/**
 * Preprocess handler for view with display id "forum_category_main".
 */
class ForumCategoryViewPreprocessHandler implements ContainerInjectionInterface, IsApplicableInterface {

  /**
   * Is applicable view id for this preprocess.
   */
  const VIEW_ID = 'leaf_child';

  /**
   * Is applicable display id for this preprocess.
   */
  const DISPLAY_ID = 'main';

  /**
   * The block manager.
   *
   * @var \Drupal\Core\Block\BlockManagerInterface
   */
  protected $blockManager;

  /**
   * {@inheritdoc}
   */
  public static function create(ContainerInterface $container) {
    $instance = new static();
    $instance->blockManager = $container->get('plugin.manager.block');

    return $instance;
  }

  /**
   * Preprocess function for view with display id "forum_category_main".
   *
   * @param array $variables
   *   An associative array.
   */
  public function preprocess(array &$variables): void {
    $configuration = [
      'taxonomy_term_id' => $variables['view']->args[1],
    ];
    $block_instance = $this->blockManager->createInstance('forum_category_description_block', $configuration);
    // Add the block to the header of the view.
    if ($block_instance instanceof BlockPluginInterface) {
      $element['header_block'] = [
        '#theme' => 'block',
        '#attributes' => [],
        '#configuration' => $block_instance->getConfiguration(),
        '#plugin_id' => $block_instance->getPluginId(),
        '#base_plugin_id' => $block_instance->getBaseId(),
        '#derivative_plugin_id' => $block_instance->getDerivativeId(),
        '#id' => $block_instance->getPluginId(),
        'content' => $block_instance->build(),
      ];
      $variables['header'] = $element;
    }
  }

  /**
   * {@inheritdoc}
   */
  public function isApplicable(mixed $object = NULL): bool {
    if (count($object['view']->args) === 2
      && isset($object['id'], $object['display_id'])
      && $object['id'] == self::VIEW_ID
      && $object['display_id'] == self::DISPLAY_ID) {
      return TRUE;
    }

    return FALSE;
  }

}
