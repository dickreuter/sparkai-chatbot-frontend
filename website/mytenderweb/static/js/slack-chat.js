/*SlackChat*/
/* v2.0.0 */
(function ($) {
  let mainOptions = {};
  let userList;

  window.slackChat = false;

  const methods = {
    init: function (options) {
      this._defaults = {
        apiToken: "",
        channelId: "",
        user: "",
        userLink: "",
        userImg: "",
        userId: "",
        defaultSysImg: "",
        defaultSysUser: "",
        queryInterval: 3000,
        chatBoxHeader: "Need help? Talk to our support team right here",
        slackColor: "#36a64f",
        messageFetchCount: 100,
        botUser: "",
        sendOnEnter: true,
        disableIfAway: false,
        elementToDisable: null,
        heightOffset: 75,
        debug: false,
        defaultUserImg: "",
        webCache: false,
        privateChannel: false,
        privateChannelId: false,
        isOpen: false,
        badgeElement: false,
        serverApiGateway: "/server/php/server.php",
        useUserDetails: false,
        defaultInvitedUsers: [],
        defaultUserImg: "/img/user-icon-small.jpg"
      };

      this._options = $.extend(true, {}, this._defaults, options);
      this._options.queryIntElem = null;
      this._options.latest = null;

      if (this._options.debug) console.log("This object :", this);

      window.slackChat._options = mainOptions = this._options;

      // Validate params
      if (!this._options.apiToken)
        methods.validationError("Parameter apiToken is required.");
      if (!this._options.channelId && !this._options.privateChannel)
        methods.validationError("Parameter channelId is required.");
      if (!this._options.user)
        methods.validationError("Parameter user is required.");
      if (!this._options.defaultSysUser)
        methods.validationError("Parameter defaultSysUser is required.");
      if (!this._options.botUser)
        methods.validationError("Parameter botUser is required.");
      if (typeof moment === "undefined")
        methods.validationError(
          "MomentJS is not available. Get it from http://momentjs.com"
        );

      if (this._options.disableIfAway && this._options.elementToDisable)
        this._options.elementToDisable.hide();

      // Create chat box
      const html = `
                <div class="slackchat slack-chat-box" style="display: none;">
                    <div class="slack-chat-header">
                        ${this._options.chatBoxHeader}
                    </div>
                    <div class="slack-message-box"></div>
                    <div class="send-area">
                    <div class="input-bar">
                        <input type="text" class="form-control slack-new-message" disabled placeholder="Hang tight while we connect...">
                        <div class="slack-post-message"><i class="fa fa-fw fa-chevron-right"></i></div>
                    </div>
                    </div>
                </div>
            `;

      $("body").append(html);

      const $this = (window.slackChat = this);

      // Register events
      $("#slackChatTrigger").on("click", function (e) {
        e.preventDefault();
        const $chatBox = $(".slack-chat-box");

        if ($chatBox.is(":visible")) {
          // Close the chat box
          $chatBox.hide().removeClass("open");
          if (!window.slackChat._options.privateChannel) {
            clearInterval(window.slackChat._options.queryIntElem);
          }
          window.slackChat._options.isOpen = false;
        } else {
          // Open the chat box
          $chatBox.show().addClass("open");
          if (window.slackChat._options.badgeElement) {
            $(window.slackChat._options.badgeElement).html("").hide();
          }
          window.slackChat._options.isOpen = true;
          $(".slack-message-box").height(
            $chatBox.height() -
              $(".desc").height() -
              $(".send-area").height() -
              parseInt(window.slackChat._options.heightOffset)
          );

          function querySlackChannel() {
            if (
              $chatBox.hasClass("open") ||
              window.slackChat._options.privateChannel
            ) {
              methods.querySlack($this);
              setTimeout(
                querySlackChannel,
                window.slackChat._options.queryInterval
              );
            }
          }
          querySlackChannel();

          $(".slackchat .slack-new-message").focus();

          if (window.slackChat._options.webCache) {
            const scParams = {
              apiToken: window.slackChat._options.apiToken,
              channelId: window.slackChat._options.channelId,
              user: window.slackChat._options.user,
              defaultSysUser: window.slackChat._options.defaultSysUser,
              botUser: window.slackChat._options.botUser,
              serverApiGateway: window.slackChat._options.serverApiGateway,
              defaultInvitedUsers: window.slackChat._options.defaultInvitedUsers
            };
            localStorage.scParams = JSON.stringify(scParams);
          }
        }
      });

      $(".slackchat .slack-post-message").click(function () {
        methods.postMessage(window.slackChat, window.slackChat._options);
      });

      $(".slackchat .slack-new-message").keyup(function (e) {
        if (window.slackChat._options.sendOnEnter && e.keyCode === 13) {
          methods.postMessage(window.slackChat, window.slackChat._options);
          e.preventDefault();
        }
      });

      methods.getUserPresence(window.slackChat, window.slackChat._options);

      $(window).resize(methods.resizeWindow);
    },

    querySlack: function ($elem) {
      const options = window.slackChat._options;

      methods.createChannel($elem, function (channel) {
        window.slackChat._options.channelId = channel.id;

        $(".slack-new-message")
          .prop("disabled", false)
          .prop("placeholder", "Write a message...");

        $.ajax({
          url: "https://slack.com/api/conversations.history",
          type: "POST",
          dataType: "json",
          data: {
            token: options.apiToken,
            channel: mainOptions.channelId,
            oldest: mainOptions.latest,
            limit: options.messageFetchCount
          },
          success: function (resp) {
            if (options.debug && resp.messages && resp.messages.length)
              console.log(resp.messages);

            if (resp.ok && resp.messages.length) {
              let html = "";
              window.slackChat._options.latest = resp.messages[0].ts;
              resp.messages.reverse();

              let repliesExist = 0;

              for (const message of resp.messages) {
                if (message.subtype === "bot_message" && message.text) {
                  const userName = message.username || "";
                  const userImg = message.icons ? message.icons.image_48 : "";
                  const msgUserId = "";

                  const messageText = methods.formatMessage(
                    message.text.trim()
                  );

                  html += `
                                        <div class='message-item'>
                                            ${
                                              userImg
                                                ? `<div class='userImg'><img src='${userImg}' /></div>`
                                                : options.defaultUserImg
                                                  ? `<div class='userImg'><img src='${options.defaultUserImg}' /></div>`
                                                  : ""
                                            }
                                            <div class='msgBox'>
                                                <div class='username'>${msgUserId ? (msgUserId === options.userId ? "You" : userName) : userName}</div>
                                                <div class='message'>${messageText}</div>
                                                ${typeof moment !== "undefined" ? `<div class='timestamp'>${moment.unix(message.ts).fromNow()}</div>` : ""}
                                            </div>
                                        </div>
                                    `;
                } else if (!message.subtype) {
                  repliesExist++;

                  const messageText = methods.formatMessage(
                    message.text.trim()
                  );

                  const userId = message.user;
                  let userName = options.defaultSysUser;
                  let userImg = options.defaultSysImg;

                  if (options.useUserDetails && userList.length) {
                    const currentUser = userList.find(
                      (user) => user.id === userId
                    );
                    if (currentUser) {
                      userName = currentUser.real_name || currentUser.name;
                      userImg = currentUser.profile.image_48;
                    }
                  }

                  html += `
                                        <div class='message-item'>
                                            ${userImg ? `<div class='userImg'><img src='${userImg}' /></div>` : ""}
                                            <div class='msgBox'>
                                                <div class='username main'>${userName}</div>
                                                <div class='message'>${messageText}</div>
                                                ${typeof moment !== "undefined" ? `<div class='timestamp'>${moment.unix(message.ts).fromNow()}</div>` : ""}
                                            </div>
                                        </div>
                                    `;
                }
              }

              $(".slack-message-box").append(html);

              $(".slack-message-box")
                .stop()
                .animate(
                  {
                    scrollTop: $(".slack-message-box")[0].scrollHeight
                  },
                  800
                );

              if (
                repliesExist > 0 &&
                !window.slackChat._options.isOpen &&
                window.slackChat._options.badgeElement
              ) {
                $(window.slackChat._options.badgeElement)
                  .html(repliesExist)
                  .show();
              }
            } else if (!resp.ok) {
              console.log("[SlackChat] Query failed with errors: ", resp);
            }
          }
        });
      });
    },

    postMessage: function ($elem) {
      const options = $elem._options;

      const attachment = {
        fallback: `View ${options.user}'s profile`,
        color: options.slackColor,
        author_name: options.user,
        author_link: options.userLink || "",
        author_icon: options.userImg || "",
        fields: options.userId
          ? [{ title: "ID", value: options.userId, short: true }]
          : []
      };

      const message = $(".slack-new-message").val().trim();
      if (!message) return false;

      $(".slack-new-message").val("");

      if (options.debug) {
        console.log("Posting Message:", { message, attachment, options });
      }

      $.ajax({
        url: "https://slack.com/api/chat.postMessage",
        type: "POST",
        dataType: "json",
        data: {
          token: options.apiToken,
          channel: window.slackChat._options.channelId,
          text: message,
          username: options.botUser,
          attachments: JSON.stringify([attachment])
        },
        success: function (resp) {
          if (!resp.ok) {
            $(".slack-new-message").val(message);
            console.log("[SlackChat] Post Message failed with errors: ", resp);
          }
        }
      });
    },

    validationError: function (errorTxt) {
      console.log("[SlackChat Error] " + errorTxt);
      return false;
    },

    getUserPresence: async function ($elem) {
      const options = $elem._options;
      let active = false;
      userList = [];

      try {
        const resp = await $.ajax({
          url: "https://slack.com/api/users.list",
          type: "POST",
          dataType: "json",
          data: { token: options.apiToken }
        });

        if (resp.ok) {
          userList = resp.members;

          for (const user of userList) {
            if (active || user.is_bot) continue;

            const presenceResp = await $.ajax({
              url: "https://slack.com/api/users.getPresence",
              dataType: "json",
              type: "POST",
              data: {
                token: options.apiToken,
                user: user.id
              }
            });

            if (presenceResp.ok) {
              if (presenceResp.presence === "active") {
                $(".slackchat .presence").addClass("active");
                $(".slackchat .presence .presence-text").text("Available");
                if (options.disableIfAway && options.elementToDisable)
                  options.elementToDisable.show();
                active = true;
                break;
              }
            }
          }

          if (!active) {
            $(".slackchat .presence").removeClass("active");
            $(".slackchat .presence .presence-text").text("Away");
          }
        }
      } catch (error) {
        console.error("[SlackChat] Error fetching user presence:", error);
      }
    },

    destroy: function ($elem) {
      $($elem).off("click");
      $(window.slackChat).off("click");
      $(".slackchat").remove();
    },

    formatMessage: function (text) {
      const formattedText = $("<textarea/>").html(text).text();

      return unescape(formattedText)
        .replace(/<(.+?)(\|(.*?))?>/g, (match, url, _text, text) => {
          if (!text) text = url;
          return $("<a>")
            .attr({
              href: url,
              target: "_blank"
            })
            .text(text)
            .prop("outerHTML");
        })
        .replace(
          /(?:[`]{3,3})(?:\n)?([a-zA-Z0-9<>\\\.\*\n\r\-_ ]+)(?:\n)?(?:[`]{3,3})/g,
          (match, code) => {
            return $("<code>").text(code).prop("outerHTML");
          }
        )
        .replace(
          /(?:[`]{1,1})([a-zA-Z0-9<>\\\.\*\n\r\-_ ]+)(?:[`]{1,1})/g,
          (match, code) => {
            return $("<code>").text(code).prop("outerHTML");
          }
        )
        .replace(/\n/g, "<br />");
    },

    createChannel: function ($elem, callback) {
      const options = $elem._options;

      if (!options.privateChannel) {
        callback({ id: options.channelId });
        return;
      }

      if (options.privateChannelId) {
        callback({ id: options.privateChannelId });
        return;
      }

      const privateChannelName = `${options.user}-${options.userId || Math.random() * 100000}`;

      const payLoad = {
        channelName: privateChannelName
      };

      if (options.defaultInvitedUsers.length > 0) {
        payLoad.invitedUsers = JSON.stringify(
          $.trim(options.defaultInvitedUsers)
        );
      }

      $.ajax({
        url: options.serverApiGateway,
        dataType: "json",
        type: "POST",
        data: payLoad,
        success: function (resp) {
          if (resp.ok) {
            options.privateChannelId =
              window.slackChat._options.privateChannelId = resp.data.id;
            callback(resp.data);
          }

          return false;
        },
        error: function () {
          return false;
        }
      });
    },

    resizeWindow: function () {
      $(".slack-message-box").height(
        $(".slack-chat-box").height() -
          $(".desc").height() -
          $(".send-area").height() -
          parseInt(window.slackChat._options.heightOffset)
      );
    }
  };

  $.fn.slackChat = function (methodOrOptions) {
    if (methods[methodOrOptions]) {
      return methods[methodOrOptions].apply(
        this,
        Array.prototype.slice.call(arguments, 1)
      );
    } else if (typeof methodOrOptions === "object" || !methodOrOptions) {
      methods.init.apply(this, arguments);
    } else {
      $.error(
        "Method " + methodOrOptions + " does not exist on jQuery.slackChat"
      );
    }
  };
})(jQuery);
