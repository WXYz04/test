(function () {
    "use strict";

    window.chapter7SessionActive = false;
    window.chapter7SequenceIndex = 0;
    window.chapter7RouteId = "intro";
    window.chapter7CurrentPage = null;
    window.chapter7TypingTimer = null;
    window.chapter7TypingText = "";
    window.chapter7TypingPosition = 0;
    window.chapter7PendingChat = null;
    window.chapter7PendingRequiredAction = null;
    window.chapter7PendingExposureWeibo = null;
    window.chapter7ExposurePost = null;
    window.chapter7LongPressTimer = null;
    window.chapter7FastTimer = null;
    window.chapter7SuppressClick = false;

    function replaceChapter7Tokens(text) {
        var currentPlayer = typeof player !== "undefined" ? player : {};
        var playerName = currentPlayer.name || "你";
        var wechatName = currentPlayer.wechatName || currentPlayer.name || "你";
        var chars = Array.from(playerName);
        var lastChar = chars.length ? chars[chars.length - 1] : "你";
        return String(text || "")
            .replace(/\{\{PLAYER_WECHAT_NAME\}\}/g, wechatName)
            .replace(/\{\{PLAYER_LAST_CHAR\}\}/g, lastChar)
            .replace(/\{\{PLAYER_NAME\}\}/g, playerName);
    }

    function ensureChapter7Style() {
        if (document.getElementById("chapter7StoryStyle")) return;
        var style = document.createElement("style");
        style.id = "chapter7StoryStyle";
        style.textContent =
            '#chapter7StoryOverlay{position:fixed;top:0;bottom:70px;left:50%;transform:translateX(-50%);width:100%;max-width:500px;z-index:94;background:#111 center/cover no-repeat;overflow:hidden}' +
            '#chapter7BackBtn{position:absolute;top:max(18px,env(safe-area-inset-top));left:18px;width:42px;height:42px;border:0;border-radius:50%;background:rgba(0,0,0,.58);color:#fff;font-size:25px;z-index:8}' +
            '#chapter7SkipBtn{position:absolute;top:0;left:50%;transform:translate(-50%,-50%);padding:7px 15px;border:1px solid rgba(255,255,255,.45);border-radius:4px;background:rgba(0,0,0,.68);color:#fff;font-size:12px;z-index:9}' +
            '#chapter7PerspectiveBadge{display:none;position:absolute;top:max(66px,calc(env(safe-area-inset-top) + 48px));left:50%;transform:translateX(-50%);padding:6px 14px;border-radius:16px;background:rgba(65,20,20,.82);color:#f2dada;font-family:STKaiti,KaiTi,serif;font-size:13px;letter-spacing:2px;z-index:8}' +
            '#chapter7TextBox{position:absolute;left:14px;right:14px;bottom:14px;min-height:150px;padding:22px 22px 30px;border:1px solid rgba(255,255,255,.24);border-radius:10px;background:rgba(5,5,8,.86);box-shadow:0 8px 28px rgba(0,0,0,.42);color:#fff;cursor:pointer;user-select:none}' +
            '#chapter7NamePlate{display:none;position:absolute;top:-34px;min-width:92px;height:35px;padding:0 20px;background:rgba(5,5,8,.94);border:1px solid rgba(255,255,255,.24);border-bottom:0;font-size:14px;font-weight:600;align-items:center;justify-content:center}' +
            '#chapter7NamePlate.left{display:flex;left:-1px;border-radius:8px 8px 0 0}#chapter7NamePlate.right{display:flex;right:-1px;border-radius:8px 8px 0 0}' +
            '#chapter7Text{font-size:15px;line-height:1.85;white-space:pre-wrap;text-shadow:0 1px 2px #000}' +
            '#chapter7Continue{position:absolute;right:18px;bottom:9px;color:rgba(255,255,255,.62);font-size:11px}' +
            '#chapter7SpeedBadge{position:absolute;top:8px;right:12px;padding:3px 9px;border-radius:12px;background:rgba(232,93,117,.88);color:#fff;font-size:11px;z-index:10;pointer-events:none}' +
            '#chapter7Opening{position:absolute;inset:0;z-index:20;display:flex;flex-direction:column;align-items:center;justify-content:center;background:#050505;color:#eee;opacity:0;transition:opacity .7s ease;pointer-events:none}' +
            '#chapter7Opening .chapter-no{font-size:15px;letter-spacing:7px;color:#aaa;margin-bottom:18px}#chapter7Opening .chapter-name{font-family:STKaiti,KaiTi,serif;font-size:34px;letter-spacing:13px;text-indent:13px}' +
            '.chapter7-story-options{position:absolute;left:18px;right:18px;top:50%;transform:translateY(-50%);z-index:22;display:flex;flex-direction:column;gap:12px}.chapter7-story-option{width:100%;padding:14px 16px;background:rgba(5,5,8,.93);border:1px solid rgba(255,255,255,.48);border-radius:3px;color:#fff;text-align:left}.chapter7-story-option strong{display:block;font-size:15px;margin-bottom:5px}.chapter7-story-option span{display:block;font-size:11px;line-height:1.55;color:#bbb}.chapter7-prompt-title{text-align:center;color:#fff;font-size:18px;line-height:1.6;margin-bottom:8px;text-shadow:0 2px 4px #000}.chapter7-ending{position:absolute;inset:0;z-index:30;display:flex;flex-direction:column;align-items:center;justify-content:center;background:rgba(0,0,0,.9);color:#eee;opacity:0;transition:opacity .8s}.chapter7-ending small{font-size:14px;letter-spacing:5px;color:#aaa;margin-bottom:18px}.chapter7-ending strong{font-family:STKaiti,KaiTi,serif;font-size:30px;letter-spacing:4px;text-align:center;padding:0 28px}' +
            '#chapter7ActionModal{position:fixed;inset:0;z-index:10020;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.45);padding:24px}#chapter7ActionModal .panel{width:min(330px,88vw);overflow:hidden;border-radius:12px;background:#fff;color:#222;text-align:center;box-shadow:0 16px 48px rgba(0,0,0,.3)}#chapter7ActionModal h3{margin:22px 18px 10px;font-size:18px}#chapter7ActionModal p{margin:0 22px 22px;color:#666;font-size:14px;line-height:1.55}#chapter7ActionModal .buttons{display:grid;grid-template-columns:1fr 1fr;border-top:1px solid #eee}#chapter7ActionModal button{height:48px;border:0;background:#fff;font-size:15px}#chapter7ActionModal button+button{border-left:1px solid #eee;color:#e34e64;font-weight:600}';
        document.head.appendChild(style);
    }

    window.openChapter7Story = function () {
        if (window.chapter7SessionActive) {
            window.restoreChapter7Story();
            return;
        }
        window.chapter7SessionActive = true;
        window.chapter7RouteId = "intro";
        window.chapter7SequenceIndex = 0;
        window.chapter7CurrentPage = null;
        window.chapter7PendingChat = null;
        ensureChapter7Style();
        var old = document.getElementById("chapter7StoryOverlay");
        if (old) old.remove();
        var overlay = document.createElement("div");
        overlay.id = "chapter7StoryOverlay";
        overlay.innerHTML = '<button id="chapter7BackBtn">←</button><div id="chapter7PerspectiveBadge">张桂源视角</div><div id="chapter7TextBox"><button id="chapter7SkipBtn">Skip</button><div id="chapter7NamePlate"></div><div id="chapter7Text"></div><div id="chapter7Continue">点击继续</div></div><div id="chapter7Opening"><div class="chapter-no">第七章</div><div class="chapter-name">梦哑</div></div>';
        document.getElementById("gameScreen").appendChild(overlay);
        document.getElementById("chapter7BackBtn").onclick = function (event) {
            event.stopPropagation();
            window.closeChapter7Story();
        };
        document.getElementById("chapter7TextBox").onclick = chapter7HandleTextBoxClick;
        installChapter7LongPress();
        document.getElementById("chapter7SkipBtn").onclick = function (event) {
            event.stopPropagation();
            chapter7SkipToNextChoice();
        };
        var opening = document.getElementById("chapter7Opening");
        requestAnimationFrame(function () { requestAnimationFrame(function () { opening.style.opacity = "1"; }); });
        setTimeout(function () { opening.style.opacity = "0"; }, 1750);
        setTimeout(function () { opening.remove(); chapter7AdvanceSequence(); }, 2500);
    };

    function chapter7ShowPage(page) {
        clearInterval(window.chapter7TypingTimer);
        window.chapter7TypingTimer = null;
        window.chapter7CurrentPage = page;
        var overlay = document.getElementById("chapter7StoryOverlay");
        if (!overlay) return;
        var backgroundName = page.bg || "wdws.jpg";
        if (backgroundName === "__white__") {
            overlay.style.backgroundImage = "none";
            overlay.style.backgroundColor = "#fff";
        } else {
            var backgroundSource = (window.chapter7EmbeddedBackgrounds && window.chapter7EmbeddedBackgrounds[backgroundName]) || backgroundName;
            if (!/^data:/.test(backgroundSource) && backgroundSource.indexOf("?") === -1) backgroundSource += "?v=20260831b";
            overlay.style.backgroundColor = "#111";
            overlay.style.backgroundImage = 'linear-gradient(rgba(0,0,0,.08),rgba(0,0,0,.2)),url("' + backgroundSource + '")';
        }
        var plate = document.getElementById("chapter7NamePlate");
        var text = document.getElementById("chapter7Text");
        var hint = document.getElementById("chapter7Continue");
        var speaker = replaceChapter7Tokens(page.speaker);
        window.chapter7TypingText = replaceChapter7Tokens(page.text);
        window.chapter7TypingPosition = 0;
        text.textContent = "";
        plate.className = "";
        plate.style.display = "none";
        if (speaker) {
            plate.textContent = speaker;
            plate.className = page.side === "right" ? "right" : "left";
            plate.style.display = "flex";
        }
        hint.textContent = "点击显示全文";
        window.chapter7TypingTimer = setInterval(function () {
            window.chapter7TypingPosition += 1;
            text.textContent = window.chapter7TypingText.slice(0, window.chapter7TypingPosition);
            if (window.chapter7TypingPosition >= window.chapter7TypingText.length) {
                clearInterval(window.chapter7TypingTimer);
                window.chapter7TypingTimer = null;
                hint.textContent = "点击继续";
            }
        }, 34);
    }

    function chapter7HandleTextBoxClick() {
        if (window.chapter7SuppressClick) {
            window.chapter7SuppressClick = false;
            return;
        }
        if (window.chapter7TypingTimer) {
            clearInterval(window.chapter7TypingTimer);
            window.chapter7TypingTimer = null;
            window.chapter7TypingPosition = window.chapter7TypingText.length;
            document.getElementById("chapter7Text").textContent = window.chapter7TypingText;
            document.getElementById("chapter7Continue").textContent = "点击继续";
            return;
        }
        if (window.chapter7PendingExposureWeibo) {
            showMessageNotification("第七章剧情", '<span style="font-size:28px">📣</span>', "提示", "请先按照提示完成微博操作", function () {});
            return;
        }
        chapter7AdvanceSequence();
    }

    function chapter7StopFastForward() {
        clearTimeout(window.chapter7LongPressTimer);
        clearInterval(window.chapter7FastTimer);
        window.chapter7LongPressTimer = null;
        window.chapter7FastTimer = null;
        var badge = document.getElementById("chapter7SpeedBadge");
        if (badge) badge.remove();
        setTimeout(function () { window.chapter7SuppressClick = false; }, 160);
    }

    function chapter7FastStep() {
        if (!document.getElementById("chapter7StoryOverlay") || document.querySelector(".chapter7-story-options,.chapter7-ending") || window.chapter7PendingChat || window.chapter7PendingRequiredAction || window.chapter7PendingExposureWeibo) {
            chapter7StopFastForward();
            return;
        }
        if (window.chapter7TypingTimer) {
            clearInterval(window.chapter7TypingTimer);
            window.chapter7TypingTimer = null;
            window.chapter7TypingPosition = window.chapter7TypingText.length;
            document.getElementById("chapter7Text").textContent = window.chapter7TypingText;
            document.getElementById("chapter7Continue").textContent = "点击继续";
            return;
        }
        var sequence = (window.chapter7Routes && window.chapter7Routes[window.chapter7RouteId]) || [];
        var next = sequence[window.chapter7SequenceIndex];
        if (!next || next.type !== "page") {
            chapter7StopFastForward();
            return;
        }
        chapter7AdvanceSequence();
    }

    function installChapter7LongPress() {
        var box = document.getElementById("chapter7TextBox");
        if (!box || box.dataset.longPressInstalled === "1") return;
        box.dataset.longPressInstalled = "1";
        function start(event) {
            if (event.target && event.target.id === "chapter7SkipBtn") return;
            if (event.button !== undefined && event.button !== 0) return;
            window.chapter7SuppressClick = false;
            clearTimeout(window.chapter7LongPressTimer);
            window.chapter7LongPressTimer = setTimeout(function () {
                window.chapter7SuppressClick = true;
                if (!document.getElementById("chapter7SpeedBadge")) {
                    var badge = document.createElement("div");
                    badge.id = "chapter7SpeedBadge";
                    badge.textContent = "剧情加速中 »»";
                    box.appendChild(badge);
                }
                chapter7FastStep();
                window.chapter7FastTimer = setInterval(chapter7FastStep, 105);
            }, 700);
        }
        box.addEventListener("pointerdown", start);
        box.addEventListener("pointerup", chapter7StopFastForward);
        box.addEventListener("pointercancel", chapter7StopFastForward);
        box.addEventListener("pointerleave", chapter7StopFastForward);
        box.addEventListener("contextmenu", function (event) { event.preventDefault(); });
    }

    function chapter7SetRoute(routeId, perspective) {
        if (!window.chapter7Routes || !window.chapter7Routes[routeId]) return false;
        window.chapter7RouteId = routeId;
        window.chapter7SequenceIndex = 0;
        window.chapter7Sequence = window.chapter7Routes[routeId];
        if (typeof perspective === "boolean") window.chapter7PerspectiveMode = perspective;
        var badge = document.getElementById("chapter7PerspectiveBadge");
        if (badge) badge.style.display = window.chapter7PerspectiveMode ? "block" : "none";
        if (typeof autoSaveGame === "function") autoSaveGame();
        return true;
    }

    function chapter7AdvanceSequence() {
        var sequence = (window.chapter7Routes && window.chapter7Routes[window.chapter7RouteId]) || window.chapter7Sequence || [];
        if (window.chapter7SequenceIndex >= sequence.length) return;
        var event = sequence[window.chapter7SequenceIndex++];
        if (event.type === "page") {
            chapter7ShowPage(event);
        } else if (event.type === "friendRequests") {
            chapter7ShowFriendRequests(event.items || [], 0);
        } else if (event.type === "privateChat") {
            chapter7StartChat("张桂源", event.messages || [], [], event.bg);
        } else if (event.type === "groupChat") {
            chapter7StartChat("everybody 棒棒", event.messages || [], event.incoming || [], event.bg);
        } else if (event.type === "choice") {
            chapter7ShowChoice(event);
        } else if (event.type === "perspectivePrompt") {
            chapter7ShowPerspectivePrompt(event);
        } else if (event.type === "routeEnd") {
            if (event.exitPerspective) window.chapter7PerspectiveMode = false;
            if (chapter7SetRoute(event.nextRoute, window.chapter7PerspectiveMode)) chapter7AdvanceSequence();
        } else if (event.type === "ending") {
            chapter7ShowEnding(event);
        } else if (event.type === "deleteContactPrompt") {
            chapter7StartRequiredAction(event.contact || "张桂源", "delete");
        } else if (event.type === "groupExitPrompt") {
            chapter7StartRequiredAction(event.contact || "everybody 棒棒", "exit");
        } else if (event.type === "exposureWeibo") {
            chapter7StartExposureWeibo(event);
        } else if (event.type === "exposureArtistWeibo") {
            chapter7StartExposureArtistWeibo(event);
        }
    }

    function chapter7EscapeHtml(value) {
        return String(value == null ? "" : value).replace(/[&<>"']/g, function (char) {
            return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char];
        });
    }

    function chapter7StartExposureWeibo(event) {
        window.chapter7PendingExposureWeibo = {
            event: event,
            published: event.phase === "moreComments",
            commentIndex: 0,
            complete: false
        };
        chapter7ShowPage({ type: "page", text: event.phase === "moreComments" ? "请前往微博，在上一条微博的评论区继续发送评论。" : "请点击下方微博，进入「我的微博」完成发帖。", speaker: "提示", side: "left", bg: event.bg || "__white__" });
        document.getElementById("chapter7Continue").textContent = "请先完成微博操作";
    }

    function chapter7StartExposureArtistWeibo(event) {
        window.chapter7PendingExposureWeibo = { event: event, artistPost: true, complete: true };
        chapter7ShowPage({ type: "page", text: "请点击下方微博，进入「我的关注」查看张桂源更新的微博。", speaker: "提示", side: "left", bg: event.bg || "__white__" });
        document.getElementById("chapter7Continue").textContent = "请先查看张桂源微博";
    }

    function chapter7ExposureAvatar() {
        var avatarData = localStorage.getItem("player_avatar");
        return avatarData && avatarData.indexOf("data:image") === 0 ? '<img src="' + avatarData + '" style="width:100%;height:100%;object-fit:cover">' : "🐰";
    }

    function chapter7RenderExposurePanel() {
        var pending = window.chapter7PendingExposureWeibo;
        if (!pending) return;
        var active = document.querySelector('#weiboTabs .tab.active');
        if (pending.artistPost) {
            chapter7RenderArtistWeiboPanel(active);
            return;
        }
        if (!active || active.dataset.tab !== "myweibo") return;
        var container = document.getElementById("weiboContent");
        if (!container) return;
        var old = document.getElementById("chapter7ExposurePanel");
        if (old) old.remove();
        var panel = document.createElement("div");
        panel.id = "chapter7ExposurePanel";
        panel.style.cssText = "background:#fff;border:1px solid #eee;border-radius:12px;padding:14px;margin-bottom:12px;box-shadow:0 3px 12px rgba(0,0,0,.05)";
        if (!pending.published) {
            panel.innerHTML = '<div style="text-align:center;color:#888;font-size:13px;padding:12px">请点击上方文本框，确认默认文案后发表微博</div>';
            container.prepend(panel);
            var input = document.getElementById("weiboInput");
            if (input && !input.value) {
                input.value = pending.event.defaultText || "";
                if (typeof updateWeiboCharCount === "function") updateWeiboCharCount();
            }
            return;
        }
        var post = window.chapter7ExposurePost || { content: pending.event.defaultText || "", userComments: [], fixedComments: [] };
        var media = "";
        if (post.hasRecords) {
            media = '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:4px;margin-top:10px">';
            for (var i = 0; i < 9; i++) media += '<div style="aspect-ratio:1;background:linear-gradient(135deg,#eee,#d7d7d7);display:flex;align-items:center;justify-content:center;color:#777;font-size:12px;border-radius:4px">聊天记录</div>';
            media += "</div>";
        }
        var comments = "";
        (post.userComments || []).forEach(function (item) {
            var entry = typeof item === "string" ? { text: item } : item;
            comments += '<div style="padding:7px 0;border-bottom:1px solid #f2f2f2;font-size:13px"><b>' + chapter7EscapeHtml((player && (player.weiboName || player.name)) || "你") + '</b>：' + chapter7EscapeHtml(entry.text) + (entry.image ? '<div style="margin-top:7px"><img src="' + chapter7EscapeHtml(entry.image) + '" style="display:block;max-width:160px;max-height:180px;border-radius:6px;object-fit:cover"></div>' : "") + '</div>';
        });
        (post.fixedComments || []).forEach(function (text, index) {
            comments += '<div style="padding:7px 0;border-bottom:1px solid #f2f2f2;font-size:13px"><b>网友' + (index + 1) + '</b>：' + chapter7EscapeHtml(text) + '</div>';
        });
        var actions = pending.complete
            ? '<button id="chapter7ExposureReturn" style="width:100%;margin-top:12px;padding:11px;border:0;border-radius:20px;background:#e85d75;color:#fff">返回剧情页面</button>'
            : '<button id="chapter7ExposureComment" style="width:100%;margin-top:12px;padding:11px;border:1px solid #e85d75;border-radius:20px;background:#fff;color:#e85d75">点击评论区发送评论</button>';
        panel.innerHTML = '<div style="display:flex;gap:9px;align-items:center"><div style="width:38px;height:38px;border-radius:50%;overflow:hidden;background:#f0f0f0;display:flex;align-items:center;justify-content:center">' + chapter7ExposureAvatar() + '</div><div><b>' + chapter7EscapeHtml((player && (player.weiboName || player.name)) || "用户") + '</b><div style="font-size:11px;color:#aaa">刚刚</div></div></div><div style="font-size:14px;line-height:1.65;margin-top:10px;white-space:pre-wrap">' + chapter7EscapeHtml(post.content) + '</div>' + media + '<div style="font-size:12px;color:#999;margin-top:10px">评论区</div><div>' + comments + '</div>' + actions;
        container.prepend(panel);
        var commentButton = document.getElementById("chapter7ExposureComment");
        if (commentButton) commentButton.onclick = chapter7SendExposureComment;
        var returnButton = document.getElementById("chapter7ExposureReturn");
        if (returnButton) returnButton.onclick = chapter7FinishExposureStep;
    }

    function chapter7RenderArtistWeiboPanel(active) {
        if (!active || active.dataset.tab !== "following") return;
        var pending = window.chapter7PendingExposureWeibo;
        var event = pending && pending.event;
        var container = document.getElementById("weiboContent");
        if (!event || !container) return;
        var old = document.getElementById("chapter7ExposurePanel");
        if (old) old.remove();
        var comments = (event.comments || []).map(function (text, index) {
            return '<div style="padding:7px 0;border-bottom:1px solid #f2f2f2;font-size:13px"><b>网友' + (index + 1) + '</b>：' + chapter7EscapeHtml(text) + '</div>';
        }).join("");
        var panel = document.createElement("div");
        panel.id = "chapter7ExposurePanel";
        panel.style.cssText = "background:#fff;border:1px solid #eee;border-radius:12px;padding:14px;margin-bottom:12px;box-shadow:0 3px 12px rgba(0,0,0,.06)";
        panel.innerHTML = '<div style="display:flex;gap:9px;align-items:center"><img src="' + (typeof getZhangGuiyuanAvatar === "function" ? getZhangGuiyuanAvatar() : "zgyx.jpg") + '" style="width:40px;height:40px;border-radius:50%;object-fit:cover"><div><b>' + chapter7EscapeHtml(event.author || "张桂源") + '</b><div style="font-size:11px;color:#aaa">刚刚</div></div></div><div style="font-size:14px;line-height:1.65;margin-top:10px;white-space:pre-wrap">' + chapter7EscapeHtml(event.content || "") + '</div><div style="position:relative;min-height:180px;background:#f1f1f1;border-radius:8px;margin-top:10px;display:flex;align-items:center;justify-content:center;color:#999;font-size:13px"><span>手写道歉信</span><img src="' + chapter7EscapeHtml(event.image || "") + '" style="position:absolute;inset:0;display:block;width:100%;height:100%;max-height:420px;object-fit:contain;background:#f6f6f6;border-radius:8px" onerror="this.style.display=\'none\'"></div><div style="display:flex;justify-content:space-between;color:#999;font-size:12px;margin-top:10px"><span>转发 ' + chapter7EscapeHtml(event.reposts || "0") + '</span><span>评论 ' + chapter7EscapeHtml(event.commentCount || "0") + '</span><span>点赞 ' + chapter7EscapeHtml(event.likes || "0") + '</span></div><div style="margin-top:8px;padding-top:6px;border-top:1px solid #eee">' + comments + '</div><button id="chapter7ExposureReturn" style="width:100%;margin-top:12px;padding:11px;border:0;border-radius:20px;background:#e85d75;color:#fff">返回剧情页面</button>';
        container.prepend(panel);
        document.getElementById("chapter7ExposureReturn").onclick = chapter7FinishExposureStep;
    }

    function chapter7SendExposureComment() {
        var pending = window.chapter7PendingExposureWeibo;
        if (!pending) return;
        var items = pending.event.userComments || [];
        if (pending.commentIndex >= items.length) return;
        var item = items[pending.commentIndex];
        var entry = typeof item === "string" ? { text: item } : item;
        chapter7ShowExposureCommentModal(entry, function () {
            if (!window.chapter7ExposurePost) window.chapter7ExposurePost = { content: "", userComments: [], fixedComments: [], hasRecords: true };
            window.chapter7ExposurePost.userComments.push(entry);
            pending.commentIndex += 1;
            if (pending.commentIndex >= items.length) {
                window.chapter7ExposurePost.fixedComments = window.chapter7ExposurePost.fixedComments.concat(pending.event.fixedComments || []);
                pending.complete = true;
            }
            chapter7RenderExposurePanel();
        });
    }

    function chapter7ShowExposureCommentModal(entry, callback) {
        var old = document.getElementById("chapter7ExposureCommentModal");
        if (old) old.remove();
        var modal = document.createElement("div");
        modal.id = "chapter7ExposureCommentModal";
        modal.style.cssText = "position:fixed;inset:0;z-index:10030;background:rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center;padding:22px";
        modal.innerHTML = '<div style="width:min(340px,92vw);background:#fff;border-radius:16px;padding:18px;box-shadow:0 16px 48px rgba(0,0,0,.3)"><div style="font-weight:700;font-size:16px;margin-bottom:12px">发送评论</div><div style="padding:12px;border:1px solid #eee;border-radius:10px;font-size:14px;line-height:1.6;word-break:break-word">' + chapter7EscapeHtml(entry.text) + (entry.image ? '<div style="margin-top:9px;color:#999;font-size:12px">附带图片：' + chapter7EscapeHtml(entry.image) + '</div>' : '') + '</div><div style="display:flex;gap:10px;margin-top:16px"><button type="button" data-role="cancel" style="flex:1;padding:10px;border:1px solid #ddd;border-radius:20px;background:#fff;color:#666">取消</button><button type="button" data-role="send" style="flex:1;padding:10px;border:0;border-radius:20px;background:#e85d75;color:#fff">发送</button></div></div>';
        document.body.appendChild(modal);
        modal.querySelector('[data-role="cancel"]').onclick = function () { modal.remove(); };
        modal.querySelector('[data-role="send"]').onclick = function () {
            modal.remove();
            callback();
        };
    }

    function chapter7FinishExposureStep() {
        window.chapter7PendingExposureWeibo = null;
        switchPage("story");
        window.restoreChapter7Story();
        setTimeout(chapter7AdvanceSequence, 180);
        if (typeof autoSaveGame === "function") autoSaveGame();
    }

    function chapter7SkipToNextChoice() {
        clearInterval(window.chapter7TypingTimer);
        window.chapter7TypingTimer = null;
        var guard = 0;
        while (guard++ < 20) {
            var sequence = (window.chapter7Routes && window.chapter7Routes[window.chapter7RouteId]) || [];
            var found = -1;
            for (var i = window.chapter7SequenceIndex; i < sequence.length; i++) {
                if (["choice", "perspectivePrompt", "ending"].indexOf(sequence[i].type) !== -1) {
                    found = i;
                    break;
                }
            }
            if (found !== -1) {
                window.chapter7SequenceIndex = found;
                chapter7AdvanceSequence();
                return;
            }
            var routeEnd = sequence.length && sequence[sequence.length - 1].type === "routeEnd" ? sequence[sequence.length - 1] : null;
            if (!routeEnd || !routeEnd.nextRoute) break;
            if (routeEnd.exitPerspective) window.chapter7PerspectiveMode = false;
            if (!chapter7SetRoute(routeEnd.nextRoute, window.chapter7PerspectiveMode)) break;
        }
        showMessageNotification("第七章", '<span style="font-size:28px">📖</span>', "提示", "当前路线后面没有新的选项", function () {});
    }

    function chapter7ShowFriendRequests(items, index) {
        if (index >= items.length) {
            setTimeout(chapter7AdvanceSequence, 450);
            return;
        }
        showMessageNotification("好友申请", '<span style="font-size:30px">👤</span>', "新的好友申请", replaceChapter7Tokens(items[index]), function () {});
        setTimeout(function () { chapter7ShowFriendRequests(items, index + 1); }, 900);
    }

    function chapter7MessageTime(offset) {
        var total = 7 * 60 + 18 + offset;
        return String(Math.floor(total / 60)).padStart(2, "0") + ":" + String(total % 60).padStart(2, "0");
    }

    function chapter7PushMessage(contact, message) {
        if (!chatData[contact]) chatData[contact] = { messages: [], newMsg: false };
        chatData[contact].messages.push(message);
        renderChatMessages();
        renderChatList();
        var box = document.getElementById("chatMessages");
        if (box) box.scrollTop = box.scrollHeight;
    }

    function chapter7StartChat(contact, messages, incoming, background) {
        if (!chatData[contact]) chatData[contact] = { messages: [], newMsg: false };
        var data = chatData[contact];
        data.chapter7ChatActive = true;
        data.newMsg = true;
        (incoming || []).forEach(function (message, index) {
            if (message.withdrawn) {
                chapter7PushMessage(contact, { from: "system", text: message.text, time: chapter7MessageTime(index), date: "2025年5月31日", read: false, chapter7: true, isSystem: true });
            } else {
                chapter7PushMessage(contact, { from: message.from, groupSender: message.from, text: replaceChapter7Tokens(message.text), avatar: chapter4GroupAvatarPath(message.from), time: chapter7MessageTime(index), date: "2025年5月31日", read: false, chapter7: true });
            }
        });
        window.chapter7PendingChat = { contact: contact, messages: messages.map(replaceChapter7Tokens), index: 0 };
        renderChatList();
        chapter7ShowPage({ type: "page", text: "请点击聊天列表", speaker: "提示", side: "left", bg: background || (window.chapter7CurrentPage && window.chapter7CurrentPage.bg) || "mk.jpg" });
        document.getElementById("chapter7Continue").textContent = "请点击下方微信进入聊天列表";
    }

    window.openChapter7Chat = function (contact) {
        currentChatContact = contact;
        var data = chatData[contact];
        if (!data) return;
        data.newMsg = false;
        (data.messages || []).forEach(function (message) { if (message.from !== "me") message.read = true; });
        document.getElementById("chatListScreen").style.display = "none";
        document.getElementById("chatDetailScreen").style.display = "flex";
        document.getElementById("chatContactName").innerText = getContactDisplayName(contact);
        var header = document.querySelector("#chatDetailScreen .chat-detail-header");
        if (header) header.classList.toggle("chapter5-group-header", contact === "everybody 棒棒");
        document.getElementById("chatBackBtn").onclick = function () {
            if (header) header.classList.remove("chapter5-group-header");
            document.getElementById("chatDetailScreen").style.display = "none";
            document.getElementById("chatListScreen").style.display = "block";
            renderChatList();
        };
        var input = document.getElementById("chatInputBox");
        input.contentEditable = "false";
        input.innerText = data.chapter7ChatActive ? "请点击选项发送" : "发送完成，请返回剧情页面";
        input.style.color = "#999";
        renderChatMessages();
        renderChatList();
        if (window.chapter7PendingChat && window.chapter7PendingChat.contact === contact) setTimeout(chapter7ShowNextOutgoingOption, 350);
    };

    function chapter7ShowNextOutgoingOption() {
        var pending = window.chapter7PendingChat;
        if (!pending || document.querySelector(".option-modal")) return;
        if (pending.index >= pending.messages.length) {
            var data = chatData[pending.contact];
            data.chapter7ChatActive = false;
            window.chapter7PendingChat = null;
            var input = document.getElementById("chatInputBox");
            if (input) input.innerText = "发送完成，请返回剧情页面";
            showMessageNotification("第七章剧情", '<span style="font-size:30px">📖</span>', "第七章剧情", "信息已发送，请返回剧情页面继续", function () { switchPage("story"); });
            if (typeof autoSaveGame === "function") autoSaveGame();
            return;
        }
        var text = pending.messages[pending.index];
        showOptionsModal([text], "选择发送", function () {
            chapter7PushMessage(pending.contact, { from: "me", text: text, time: chapter7MessageTime(pending.index + 3), date: "2025年5月31日", read: true, chapter7: true });
            pending.index += 1;
            setTimeout(chapter7ShowNextOutgoingOption, 300);
        });
    }

    function chapter7ShowChoice(event) {
        var options = event.options || [];
        var overlay = document.getElementById("chapter7StoryOverlay");
        if (!overlay || overlay.querySelector(".chapter7-story-options")) return;
        document.getElementById("chapter7Continue").textContent = "请做出选择";
        var wrap = document.createElement("div");
        wrap.className = "chapter7-story-options";
        options.forEach(function (option, index) {
            var button = document.createElement("button");
            button.className = "chapter7-story-option";
            button.innerHTML = "<strong>" + (index + 1) + ". " + replaceChapter7Tokens(option.title) + "</strong><span>" + replaceChapter7Tokens(option.description) + "</span>";
            button.onclick = function (clickEvent) {
                clickEvent.stopPropagation();
                if (option.unavailable || !option.route) {
                    showMessageNotification("第七章剧情", '<span style="font-size:28px">📖</span>', "路线提示", "该选项的后续剧情暂未更新，请选择当前已开放的路线", function () {});
                    return;
                }
                localStorage.setItem("chapter7_choice_" + (event.id || "route"), String(index));
                wrap.remove();
                chapter7SetRoute(option.route, false);
                if (typeof autoSaveGame === "function") autoSaveGame();
                chapter7AdvanceSequence();
            };
            wrap.appendChild(button);
        });
        overlay.appendChild(wrap);
    }

    function chapter7ShowPerspectivePrompt(event) {
        var overlay = document.getElementById("chapter7StoryOverlay");
        if (!overlay || overlay.querySelector(".chapter7-story-options")) return;
        document.getElementById("chapter7Continue").textContent = "请选择";
        var wrap = document.createElement("div");
        wrap.className = "chapter7-story-options";
        var title = document.createElement("div");
        title.className = "chapter7-prompt-title";
        title.textContent = event.title || "是否查看上帝视角？";
        wrap.appendChild(title);
        [{ label: "是，查看上帝视角", route: event.yesRoute, perspective: true }, { label: "否，继续后续剧情", route: event.noRoute, perspective: false }].forEach(function (item) {
            var button = document.createElement("button");
            button.className = "chapter7-story-option";
            button.innerHTML = "<strong>" + item.label + "</strong>";
            button.onclick = function (clickEvent) {
                clickEvent.stopPropagation();
                wrap.remove();
                chapter7SetRoute(item.route, item.perspective);
                chapter7AdvanceSequence();
            };
            wrap.appendChild(button);
        });
        overlay.appendChild(wrap);
    }

    function chapter7ShowActionModal(action) {
        var old = document.getElementById("chapter7ActionModal");
        if (old) old.remove();
        var isDelete = action.actionType === "delete";
        var modal = document.createElement("div");
        modal.id = "chapter7ActionModal";
        modal.innerHTML = '<div class="panel"><h3>' + (isDelete ? '删除好友' : '退出群聊') + '</h3><p>' + (isDelete ? '删除好友后历史聊天也会清空。确定删除张桂源吗？' : '退出后群聊记录将会清空。确定退出群聊吗？') + '</p><div class="buttons"><button type="button" data-role="cancel">取消</button><button type="button" data-role="confirm">确定</button></div></div>';
        document.body.appendChild(modal);
        modal.querySelector('[data-role="cancel"]').onclick = function () { modal.remove(); };
        modal.querySelector('[data-role="confirm"]').onclick = function () {
            modal.remove();
            action.confirmed = true;
            /* 测试版只验证流程，不清空联系人、群聊或历史消息。 */
            var more = document.getElementById("chatMoreBtn");
            if (more) more.onclick = null;
            window.chapter7PendingRequiredAction = null;
            switchPage("story");
            window.restoreChapter7Story();
            setTimeout(chapter7AdvanceSequence, 180);
        };
    }

    function chapter7StartRequiredAction(contact, actionType) {
        if (!chatData[contact]) chatData[contact] = { messages: [], newMsg: false };
        var action = { contact: contact, actionType: actionType, confirmed: false };
        window.chapter7PendingRequiredAction = action;
        switchPage("chat");
        window.openChapter7Chat(contact);
        var more = document.getElementById("chatMoreBtn");
        if (more) {
            more.style.display = "block";
            more.onclick = function (event) {
                event.stopPropagation();
                chapter7ShowActionModal(action);
            };
        }
        var back = document.getElementById("chatBackBtn");
        if (back) back.onclick = function () {
            var message = actionType === "delete" ? "请先删除张桂源继续剧情！" : "请先退出群聊继续剧情！";
            showMessageNotification("第七章剧情", '<span style="font-size:28px">📖</span>', "提示", message, function () {});
        };
        var input = document.getElementById("chatInputBox");
        if (input) input.innerText = actionType === "delete" ? "请点击右上角删除好友" : "请点击右上角退出群聊";
    }

    function chapter7ShowEnding(event) {
        var overlay = document.getElementById("chapter7StoryOverlay");
        if (!overlay) return;
        var ending = document.createElement("div");
        ending.className = "chapter7-ending";
        ending.innerHTML = "<small>结局达成</small><strong>" + replaceChapter7Tokens(event.title || "") + "</strong>";
        overlay.appendChild(ending);
        requestAnimationFrame(function () { requestAnimationFrame(function () { ending.style.opacity = "1"; }); });
        localStorage.setItem("chapter7_ending_" + (event.title || "ending"), "1");
        if (typeof autoSaveGame === "function") autoSaveGame();
        setTimeout(function () {
            ending.onclick = function () {
                ending.style.opacity = "0";
                setTimeout(function () { ending.remove(); }, 800);
            };
        }, 900);
    }

    window.suspendChapter7Story = function () {
        var overlay = document.getElementById("chapter7StoryOverlay");
        if (overlay) overlay.style.display = "none";
    };

    window.restoreChapter7Story = function () {
        var overlay = document.getElementById("chapter7StoryOverlay");
        if (!overlay) return;
        document.getElementById("chapterSelectPage").style.display = "none";
        document.getElementById("storyDetailPage").style.display = "block";
        overlay.style.display = "block";
        document.getElementById("chapter7TextBox").onclick = chapter7HandleTextBoxClick;
        installChapter7LongPress();
    };

    window.closeChapter7Story = function () {
        window.suspendChapter7Story();
        document.getElementById("storyDetailPage").style.display = "none";
        document.getElementById("chapterSelectPage").style.display = "block";
        renderChapterList();
    };

    var chapter7OriginalRenderWeibo = window.renderWeibo;
    if (typeof chapter7OriginalRenderWeibo === "function") {
        window.renderWeibo = function () {
            chapter7OriginalRenderWeibo.apply(this, arguments);
            chapter7RenderExposurePanel();
        };
    }

    var chapter7OriginalSwitchWeiboTab = window.switchWeiboTab;
    if (typeof chapter7OriginalSwitchWeiboTab === "function") {
        window.switchWeiboTab = function (tab) {
            chapter7OriginalSwitchWeiboTab.apply(this, arguments);
            if (tab === "myweibo" || tab === "following") setTimeout(chapter7RenderExposurePanel, 0);
        };
    }

    var chapter7OriginalPublishWeibo = window.publishWeibo;
    window.publishWeibo = function () {
        var pending = window.chapter7PendingExposureWeibo;
        if (!pending || pending.published || pending.event.phase === "moreComments") {
            return chapter7OriginalPublishWeibo && chapter7OriginalPublishWeibo.apply(this, arguments);
        }
        var input = document.getElementById("weiboInput");
        var content = input ? input.value.trim() : "";
        if (!content) {
            alert("请输入内容");
            return;
        }
        window.chapter7ExposurePost = {
            content: content,
            userComments: [],
            fixedComments: [],
            hasRecords: pending.event.phase === "firstPost"
        };
        pending.published = true;
        pending.commentIndex = 0;
        if (pending.event.phase === "secondPost") {
            window.chapter7ExposurePost.fixedComments = (pending.event.fixedComments || []).slice();
            pending.complete = true;
        }
        if (input) input.value = "";
        if (typeof updateWeiboCharCount === "function") updateWeiboCharCount();
        chapter7RenderExposurePanel();
    };

    var chapter7PublishButton = document.getElementById("publishWeiboBtn");
    if (chapter7PublishButton) {
        chapter7PublishButton.addEventListener("click", function (event) {
            var pending = window.chapter7PendingExposureWeibo;
            if (!pending || pending.published || pending.event.phase === "moreComments") return;
            event.preventDefault();
            event.stopImmediatePropagation();
            window.publishWeibo();
        }, true);
    }
})();
