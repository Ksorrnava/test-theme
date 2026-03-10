(function ($, Drupal) {

  'use strict';

  Drupal.behaviors.slickSliderInit = {
    attach: function (context) {
      $('.images.images--wrapper, .videos.videos--wrapper').not('.slick-initialized').slick({
        slidesToShow: 1,
        slidesToScroll: 1,
        dots: true,
        nextArrow: "<button type='button' class='slick-arrow slick-next'> <img" +
          " src='/themes/custom/elfbv/assets/media/icons/arrow-right.svg'" +
          " alt='next arrow'></button>",
        prevArrow: "<button type='button' class='slick-arrow slick-prev'> <img" +
          " src='/themes/custom/elfbv/assets/media/icons/arrow-left.svg'" +
          " alt='next arrow'></button>",
        responsive: [
          {
            breakpoint: 992,
            settings: {
              arrows: false
            }
          }
        ]

      });
    }
  }

})(jQuery, Drupal);
