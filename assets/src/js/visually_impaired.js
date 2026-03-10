(function ($, Drupal, once, Cookies) {
  Drupal.behaviors.visually_impaired = {
    attach: function (context, settings) {
      const body = 'body';
      const icons = '#visually_impaired_icons';
      const main = 'main';
      const footer = 'footer';

      $(once('top-visually-impaired', '.top-visually-impaired', context))
      //$('.top-visually-impaired')
        .click(function () {
        let block = document.getElementById('visually_impaired_icons')
        if(block !== undefined) {
         let visually_impaired = Cookies.get('visually_impaired')
          if (visually_impaired === 'on') {
            block.classList.add('d-none');
            Cookies.set('visually_impaired', 'off', {
              expires: 30, path: '/',
            });
            /*Cookies.delete('visually-impaired-fontsize');
            Cookies.delete('visually-impaired-color');
            Cookies.delete('visually-impaired-images');
            Cookies.delete('visually-impaired-kerning');*/
            $(body).removeClass('letterSpacing')
              .removeClass('backgroundColor').removeClass('fontSize')
              .css('backgroundColor', '').css('fontSize', '')
              .css('color', '').css('letterSpacing', '');
            $(main).css('fontSize', '').css('letterSpacing', '');
            $(footer).css('fontSize', '').css('letterSpacing', '');
            $('img').each(function () {
              $(this).removeClass('img-grayscale');
              $(this).removeClass('hidden');
            });
          };
          if (visually_impaired === 'off')  {
            block.classList.remove('d-none');
            Cookies.set('visually_impaired', 'on', {
              expires: 30, path: '/',
            });
          };
        }

      })

      $(once('a-fontsize-small', '.a-fontsize-small', context))
        .click(function () {
        // eslint-disable-next-line
        $(main).css('fontSize', '100%');
        $(footer).css('fontSize', '100%');
        $(icons).addClass('fontsize-small')
          .removeClass('fontsize-normal')
          .removeClass('fontsize-big');
        Cookies.set('visually-impaired-fontsize', 'fontsize-small', {
          expires: 30,
          path: '/',
        });
      });

      $(once('a-fontsize-normal', '.a-fontsize-normal', context))
        .click(function () {
        // eslint-disable-next-line
        $(main).css('fontSize', '120%');
        $(footer).css('fontSize', '120%');
        $(icons).removeClass('fontsize-small')
          .addClass('fontsize-normal')
          .removeClass('fontsize-big');
        Cookies.set('visually-impaired-fontsize', 'fontsize-normal', {
          expires: 30,
          path: '/',
        });
      });

      $(once('a-fontsize-big', '.a-fontsize-big', context))
        .click(function () {
        // eslint-disable-next-line
        $(main).css('fontSize', '150%');
        $(footer).css('fontSize', '150%');
        $(icons).removeClass('fontsize-small')
          .removeClass('fontsize-normal')
          .addClass('fontsize-big');
        Cookies.set('visually-impaired-fontsize', 'fontsize-big', {
          expires: 30,
          path: '/',
        });
      });

      $(once('a-color1', '.a-color1', context))
        .click(function () {
        $(body).css('backgroundColor', '#fff')
          .css('color', '#000');
        $('a').each(function () {
          // eslint-disable-next-line
          $(this)
            .not('header')
            .not('#toolbar-bar a')
            .not('#toolbar-item-administration-tray a')
            .css('color', '#309');
        });
        $('header').css('background-color', '#fff');
        $(icons).addClass('color1')
          .removeClass('color2')
          .removeClass('color3');
        Cookies.set('visually-impaired-color', 'color1', {
          expires: 30,
          path: '/',
        });
      });

      $(once('a-color2', '.a-color2', context))
        .click(function () {
        // eslint-disable-next-line
        $(body).css('backgroundColor', '#000')
        .css('color', '#fff');
        $('a').each(function () {
          // eslint-disable-next-line
          $(this)
            .not('header')
            .not('#toolbar-bar a')
            .not('#toolbar-item-administration-tray a')
            .css('color', '#fff');
        });
        $('header').css('background-color', '#fff');
        $(icons).removeClass('color1')
          .addClass('color2')
          .removeClass('color3');
        Cookies.set('visually-impaired-color', 'color2', {
          expires: 30,
          path: '/',
        });
      });

      $(once('a-color3', '.a-color3', context))
        .click(function () {
        // eslint-disable-next-line
        $(body).css('backgroundColor', '#9dd1ff')
        // eslint-disable-next-line
          .css('color', '#063462');
        $('a').each(function () {
          // eslint-disable-next-line
          $(this)
            .not('header')
            .not('#toolbar-bar a')
            .not('#toolbar-item-administration-tray a')
            .css('color', '#309');
        });
        $('header').css('background-color', '#fff');
        $(icons).removeClass('color1')
          .removeClass('color2')
          .addClass('color3');
        Cookies.set('visually-impaired-color', 'color3', {
          expires: 30,
          path: '/',
        });
      });

      $(once('a-imgcolor', '.a-imgcolor', context))
        .click(function () {
        $('img').each(function () {
          $(this).removeClass('img-grayscale');
          $(this).removeClass('hidden');
        });
        $(icons).addClass('imgcolor')
          .removeClass('imggray')
          .removeClass('imgnone');
        Cookies.set('visually-impaired-images', 'imgcolor', {
          expires: 30,
          path: '/',
        });
      });

      $(once('a-imggray', '.a-imggray', context))
        .click(function () {
        $('img').each(function () {
          $(this).addClass('img-grayscale');
          $(this).removeClass('hidden');
        });
        $(icons).removeClass('imgcolor')
          .addClass('imggray')
          .removeClass('imgnone');
        Cookies.set('visually-impaired-images', 'imggray', {
          expires: 30,
          path: '/',
        });
      });

      $(once('a-imgnone', '.a-imgnone', context))
        .click(function () {
        $('img').each(function () {
          $(this).addClass('hidden');
        });
        $(icons).removeClass('imgcolor')
          .removeClass('imggray')
          .addClass('imgnone');
        Cookies.set('visually-impaired-images', 'imgnone', {
          expires: 30,
          path: '/',
        });
      });

      $(once('a-kernstd', '.a-kernstd', context))
        .click(function () {
        // eslint-disable-next-line
        $(main).css('letterSpacing', 'normal');
        $(footer).css('letterSpacing', 'normal');
        // eslint-disable-next-line
        $('.access').css('letterSpacing', 'normal');
        // eslint-disable-next-line
        $('#toolbar-bar').css('letterSpacing', 'normal');
        // eslint-disable-next-line
        $('#toolbar-item-administration-tray').css('letterSpacing', 'normal');
        $(icons).addClass('kernstd')
          .removeClass('kernmid')
          .removeClass('kernbig')
        Cookies.set('visually-impaired-kerning', 'kernstd', {
          expires: 30,
          path: '/',
        });
      });

      //$(once('a-kernmid', '.a-kernmid', context))
      $('.a-kernmid')
        .click(function () {
        // eslint-disable-next-line
        $(main).css('letterSpacing', '2px');
        $(footer).css('letterSpacing', '2px');
        // eslint-disable-next-line
        $('.access').css('letterSpacing', 'normal');
        // eslint-disable-next-line
        $('#toolbar-bar').css('letterSpacing', 'normal');
        // eslint-disable-next-line
        $('#toolbar-item-administration-tray').css('letterSpacing', 'normal');
        $(icons).removeClass('kernstd')
          .addClass('kernmid')
          .removeClass('kernbig');
        Cookies.set('visually-impaired-kerning', 'kernmid', {
          expires: 30,
          path: '/',
        });
      });

      $(once('a-kernbig', '.a-kernbig', context))
        .click(function () {
        // eslint-disable-next-line
        $(main).css('letterSpacing', '4px');
        $(footer).css('letterSpacing', '4px');
        // eslint-disable-next-line
        $('.access').css('letterSpacing', 'normal');
        // eslint-disable-next-line
        $('#toolbar-bar').css('letterSpacing', 'normal');
        // eslint-disable-next-line
        $('#toolbar-item-administration-tray').css('letterSpacing', 'normal');
        $(icons).removeClass('kernstd')
          .removeClass('kernmid')
          .addClass('kernbig');
        Cookies.set('visually-impaired-kerning', 'kernbig', {
          expires: 30,
          path: '/',
        });
      });

      $(once('visually-impaired-init', '.visually-impaired-icons .access', context))
        .each(function () {
          let visually_impaired = Cookies.get('visually_impaired');
          if (visually_impaired === 'on') {
            if ($('body').hasClass('user-logged-in')) {
              // eslint-disable-next-line
              $(this).css('top', '78px');
              // eslint-disable-next-line
              $('.access').css('z-index', '1');
            }
            $(icons).removeClass('d-none');
            switch (Cookies.get('visually-impaired-fontsize')) {
              case 'fontsize-small':
                $('.a-fontsize-small').click();
                break;
              case 'fontsize-normal':
                $('.a-fontsize-normal').click();
                break;
              case 'fontsize-big':
                $('.a-fontsize-big').click();
                break;
            }
            switch (Cookies.get('visually-impaired-color')) {
              case 'color1':
                $('.a-color1').click();
                break;
              case 'color2':
                $('.a-color2').click();
                break;
              case 'color3':
                $('.a-color3').click();
                break;
            }
            switch (Cookies.get('visually-impaired-images')) {
              case 'imgcolor':
                $('.a-imgcolor').click();
                break;

              case 'imggray':
                $('.a-imggray').click();
                break;

              case 'imgnone':
                $('.a-imgnone').click();
                break;
            }
            switch (Cookies.get('visually-impaired-kerning')) {
              case 'kernstd':
                $('.a-kernstd').click();
                break;
              case 'kernmid':
                $('.a-kernmid').click();
                break;
              case 'kernbig':
                $('.a-kernbig').click();
                break;
            }
          };
          if (visually_impaired === undefined) {
            Cookies.set('visually_impaired', 'off', {
              expires: 30, path: '/',
            });
          }
        });
    },
  };
})(jQuery, Drupal, once, Cookies);
