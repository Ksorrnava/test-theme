(function ($, Drupal, drupalSettings, once) {

  'use strict';

  Drupal.behaviors.headerMain = {
    attach: function (context, settings) {
      $(once('dropdown-toggle', '.show_hide_dropdown', context)).on('click', function () {
        $(this).prev().slideToggle(500);
        $(this).toggleClass('rotate');
      });

      $(once('dropdown-item-toggle', '.show_hide_dropdown_item', context)).on('click', function () {
        $(this).parent().next().slideToggle(350);
        $(this).toggleClass('rotate');
      });

      $(once('categories-visibility', '.categories__visibility', context)).on('click', function () {
        $('.categories').toggleClass('categories--more');
        $(this).children('img').toggleClass('rotate');
      });

      $(once('mobile-menu-toggle', '.menu__button-open, .left-menu__button-close', context)).on('click', function () {
        //$('#menuLeft').toggleClass('menu__left--open');
        const top_menu = document.getElementById('top-menu');
        if(top_menu.classList.contains('show')) {
          top_menu.classList.remove('show');
        } else {
          top_menu.classList.add('show');
        }
      });

      $(once('dropdown-item-toggle', '.show_hide_children', context)).on('click', function () {
        $(this).parent().parent().toggleClass('show-children');
        $(this).toggleClass('rotate');
      });

      $(once('bef-links', '.path-faq .view-faq .form-item-category-target-id', context)).on('click', function () {
        $(this).find('.form-select.bef-links').slideToggle(350);
        $(this).children('label').toggleClass('dropdown--show');
      });
    }
  };

  Drupal.behaviors.pollAutoSubmit = {
    attach: function (context) {
      $(once('auto-submit', '.poll', context)).on('click', function () {
        $(this).parents('form').find('.form-submit').trigger('mousedown');
      });
    }
  };

  Drupal.behaviors.hideShowComments = {
    attach: function (context) {
      $(once('auto-submit', '.comment .replies', context)).on('click', function () {
        const comment = $(this).closest(".comment");

        if (comment.next().hasClass("indented")) {
          comment.toggleClass("cover-rotate");
          comment.next().slideToggle(350);
        }
      });
    }
  };

  Drupal.behaviors.showAdditionalPassFields = {
    attach: function (context) {
      $(once('user-edit-form-additional-pass-fields-button', '.js-user-edit-form-additional-pass-fields-button', context)).on('click', function (event) {
        const fieldsWrapper = document.querySelector(".js-user-edit-form-additional-pass-fields");

        fieldsWrapper.classList.remove("hidden")
        $(this).addClass("hidden");
        $(this).closest(".user-edit-form__content-item").addClass("expanded");
        $(this).closest("form").find('[type="email"]').attr("disabled", "disabled");
      });
    }
  }

  Drupal.behaviors.countCharsInAboutUserTextarea = {
    attach: function (context) {
      $(once("count-chars-in-user-textarea", ".form-textarea-wrapper textarea", context)).on('input', function (event) {
        const counter = document.querySelector(".js-user-profile-about-chars-counter");

        if (!counter) {
          return null;
        }

        if (event.target.value.length > 200) {
          event.preventDefault();
          event.target.value = event.target.value.slice(0, 200);
        }

        counter.textContent = event.target.value.length;
      })
    }
  }

  Drupal.behaviors.initialCountCharsInAboutUserTextarea = {
    attach: function (context) {
      $(once('initialCountChars', ".form-textarea-wrapper textarea", context)).each(function () {
        if (location.pathname.includes("/edit/profile")) {
          const textareaField = document.querySelector(".form-textarea-wrapper textarea");
          const counter = document.querySelector(".js-user-profile-about-chars-counter");
          if (!counter || !textareaField) {
            return null;
          }

          if (textareaField.value.length > 200) {
            textareaField.value = textareaField.value.slice(0, 200);
          }

          counter.textContent = textareaField.value.length;
        }
      })
    }
  }

  Drupal.behaviors.hideShowLastMessagesBlock = {
    attach: function (context) {
      $(once('user-last-messages', '.js-user-feature-blocks .user-block__button', context)).on('click', function () {
        $(this).parent().parent().toggleClass("expanded");
      });
    }
  };

  Drupal.behaviors.watchForUserProfileImageUpload = {
    attach: function (context) {
      $(once("watch-user-profile-image-upload", ".js-user-profile-image-upload", context)).each(function() {
        const targetNode = document.querySelector(".js-user-profile-image-upload");

        const config = {childList: true, subtree: true };

        const callback = (mutationList, observer) => {
          for (const mutation of mutationList) {
            if (mutation.target.firstChild.querySelector("img")) {
              const label = mutation.target.firstChild.querySelector("label");
              label.classList.add("hidden");
              break;
            } else {
              const label = mutation.target.firstChild.querySelector("label");
              label.classList.remove("hidden");
              break;
            }
          }
        };

        const observer = new MutationObserver(callback);
        observer.observe(targetNode, config);
      })
    }
  }

  Drupal.behaviors.controlActiveStateFAQCategories = {
    attach: function (context) {
      $(once('faq-scroll-to-category', '#block-elfbv-faq-categories', context)).each(function () {
        const categoryLink = document.querySelector("[data-category-target-id]");
        const categories = [...document.querySelectorAll(`[data-faq-category-heading]`)];
        let activeCategoryLink = categoryLink;
        activeCategoryLink.classList.add("active");
        categories.reverse();
        window.addEventListener("scroll", () => {
          for (const category of categories) {
            if (window.scrollY + 76 >= category.offsetTop) {
              if (category.id == activeCategoryLink.getAttribute("data-category-target-id")) {
                break;
              }

              activeCategoryLink.classList.remove("active");
              const currentActiveId = category.id;
              const currentActiveLink = document.querySelector(`[data-category-target-id="${currentActiveId}"]`)
              currentActiveLink.classList.add("active");
              activeCategoryLink = currentActiveLink;
              break;
            }
          }
        });

        this.addEventListener("click", (event) => {
          if(event.target.closest("a.link")) {
            event.preventDefault();
            const link = event.target.closest("a.link");
            const categoryId = link.getAttribute("data-category-target-id");

            const category = document.getElementById(`${categoryId}`);
            const categoryOffset = category.offsetTop;
            window.scrollTo({top: categoryOffset - 75, behavior: "smooth"})
          }
        })
      });
    }
  };

  Drupal.behaviors.commentsNotificationsState = {
    attach: function (context) {
      $(once('comments-notifications-state', '.js-account-edit-comments-notifications', context)).each(function () {
        const notificationCheckbox = document.querySelector("#edit-entity-notify");

        const checkCheckboxStatus = () => {
          if (notificationCheckbox.checked) {
            this.classList.remove("hidden")
          } else {
            this.classList.add("hidden")
          }
        }

        checkCheckboxStatus()

        notificationCheckbox.addEventListener("change", () => {
          checkCheckboxStatus()
        });
      });
    }
  };
  Drupal.behaviors.getBodySpacingTop = {
    attach: function (context) {
      $(once('get-body-spacing-top', 'body', context)).each(function () {
        const targetNode = document.querySelector("body");
        const config = { attributes: true, attributeOldValue: true};
        let once = false;
        const callback = (mutationList, observer) => {
          for (const mutation of mutationList) {
            if (mutation.attributeName === "style" && !mutation.oldValue?.includes(`--fixed-elements-top-space: ${targetNode.style.paddingTop}`)) {

              targetNode.style.setProperty("--fixed-elements-top-space", targetNode.style.paddingTop)
            }
          }
        };

        const observer = new MutationObserver(callback);
        observer.observe(targetNode, config);
      });
    }
  }

  Drupal.behaviors.userProfileEdit = {
    attach: function (context) {
      $(once("user-profile-edit", ".js-user-profile-edit-wrapper", context)).each(function () {
        const passwordsEditButton = document.querySelector(".js-user-edit-form-additional-pass-fields-button");
        const emailInput = this.querySelector("input[type='email']");

        if (!emailInput || !passwordsEditButton) {
          return false;
        }
        emailInput.addEventListener("input", () => {
          if (!passwordsEditButton.hasAttribute("disabled")) {
            passwordsEditButton.setAttribute("disabled", "disabled");
          }
        })
      })
    }
  }

  Drupal.behaviors.leftTopBlock = {
    attach: function (context) {
      const left_top_block = document.getElementById('left-top-block');
      const left_column = document.getElementById('left-column');
      const center_column = document.getElementById('center-column');
      const top_menu_wrapper = document.getElementById('top-menu-wrapper');
      const top_menu = document.getElementById('top-menu');
      const header = document.getElementById('header');

      function moveElement() {
        if (window.innerWidth < 1400) {
          // Переместить в контейнер 2, если экран широкий
          if (left_top_block.parentNode !== center_column) {
            center_column.prepend(left_top_block);
          }
          header.appendChild(top_menu);
          top_menu.classList.add('dropdown-menu');

        } else {
          // Вернуть в контейнер 1, если экран узкий
          if (left_top_block.parentNode !== left_column) {
            left_column.prepend(left_top_block);
          }
          top_menu_wrapper.appendChild(top_menu);
          top_menu.classList.remove('dropdown-menu');
        }
      }
          window.addEventListener('resize', moveElement);
          moveElement();
    }
  }

  Drupal.behaviors.viewFrontNews = {
    attach: function (context, drupalSettings) {
      $(once("block-right-column-countries",
        ".view-display-id-block_right_column_countries .news-country",
        context, drupalSettings)).on('click',function () {
        event.preventDefault();
        const promoted = this.getAttribute('data-promoted');
        const country = this.getAttribute('data-country-id');
        const url = drupalSettings.front_news.views_block_url
        +'?promoted=' + promoted + '&country=' + country;
        var ajax = Drupal.ajax(
          { url: url, progress: { type: 'throbber' }, httpMethod: 'GET' });
        ajax.execute();
        $('.view-display-id-block_right_column_countries .news-country').removeClass('news-country-clicked');
        this.classList.add('news-country-clicked');
      })
    }
  }

})(jQuery, Drupal, drupalSettings, once);
