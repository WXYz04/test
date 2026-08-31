(function () {
    "use strict";

    window.chapter7SessionActive = false;
    window.chapter7SequenceIndex = 0;
    window.chapter7CurrentPage = null;
    window.chapter7TypingTimer = null;
    window.chapter7TypingText = "";
    window.chapter7TypingPosition = 0;
    window.chapter7PendingChat = null;

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
            '#chapter7TextBox{position:absolute;left:14px;right:14px;bottom:14px;min-height:150px;padding:22px 22px 30px;border:1px solid rgba(255,255,255,.24);border-radius:10px;background:rgba(5,5,8,.86);box-shadow:0 8px 28px rgba(0,0,0,.42);color:#fff;cursor:pointer;user-select:none}' +
            '#chapter7NamePlate{display:none;position:absolute;top:-34px;min-width:92px;height:35px;padding:0 20px;background:rgba(5,5,8,.94);border:1px solid rgba(255,255,255,.24);border-bottom:0;font-size:14px;font-weight:600;align-items:center;justify-content:center}' +
            '#chapter7NamePlate.left{display:flex;left:-1px;border-radius:8px 8px 0 0}#chapter7NamePlate.right{display:flex;right:-1px;border-radius:8px 8px 0 0}' +
            '#chapter7Text{font-size:15px;line-height:1.85;white-space:pre-wrap;text-shadow:0 1px 2px #000}' +
            '#chapter7Continue{position:absolute;right:18px;bottom:9px;color:rgba(255,255,255,.62);font-size:11px}' +
            '#chapter7Opening{position:absolute;inset:0;z-index:20;display:flex;flex-direction:column;align-items:center;justify-content:center;background:#050505;color:#eee;opacity:0;transition:opacity .7s ease;pointer-events:none}' +
            '#chapter7Opening .chapter-no{font-size:15px;letter-spacing:7px;color:#aaa;margin-bottom:18px}#chapter7Opening .chapter-name{font-family:STKaiti,KaiTi,serif;font-size:34px;letter-spacing:13px;text-indent:13px}' +
            '.chapter7-story-options{position:absolute;left:18px;right:18px;top:50%;transform:translateY(-50%);z-index:22;display:flex;flex-direction:column;gap:12px}.chapter7-story-option{width:100%;padding:14px 16px;background:rgba(5,5,8,.93);border:1px solid rgba(255,255,255,.48);border-radius:3px;color:#fff;text-align:left}.chapter7-story-option strong{display:block;font-size:15px;margin-bottom:5px}.chapter7-story-option span{display:block;font-size:11px;line-height:1.55;color:#bbb}';
        document.head.appendChild(style);
    }

    window.openChapter7Story = function () {
        if (window.chapter7SessionActive) {
            window.restoreChapter7Story();
            return;
        }
        window.chapter7SessionActive = true;
        window.chapter7SequenceIndex = 0;
        window.chapter7CurrentPage = null;
        window.chapter7PendingChat = null;
        ensureChapter7Style();
        var old = document.getElementById("chapter7StoryOverlay");
        if (old) old.remove();
        var overlay = document.createElement("div");
        overlay.id = "chapter7StoryOverlay";
        overlay.innerHTML = '<button id="chapter7BackBtn">←</button><div id="chapter7TextBox"><div id="chapter7NamePlate"></div><div id="chapter7Text"></div><div id="chapter7Continue">点击继续</div></div><div id="chapter7Opening"><div class="chapter-no">第七章</div><div class="chapter-name">梦哑</div></div>';
        document.getElementById("gameScreen").appendChild(overlay);
        document.getElementById("chapter7BackBtn").onclick = function (event) {
            event.stopPropagation();
            window.closeChapter7Story();
        };
        document.getElementById("chapter7TextBox").onclick = chapter7HandleTextBoxClick;
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
        overlay.style.backgroundImage = 'linear-gradient(rgba(0,0,0,.08),rgba(0,0,0,.2)),url("' + (page.bg || "wdws.jpg") + '")';
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
        if (window.chapter7TypingTimer) {
            clearInterval(window.chapter7TypingTimer);
            window.chapter7TypingTimer = null;
            window.chapter7TypingPosition = window.chapter7TypingText.length;
            document.getElementById("chapter7Text").textContent = window.chapter7TypingText;
            document.getElementById("chapter7Continue").textContent = "点击继续";
            return;
        }
        chapter7AdvanceSequence();
    }

    function chapter7AdvanceSequence() {
        var sequence = window.chapter7Sequence || [];
        if (window.chapter7SequenceIndex >= sequence.length) return;
        var event = sequence[window.chapter7SequenceIndex++];
        if (event.type === "page") {
            chapter7ShowPage(event);
        } else if (event.type === "friendRequests") {
            chapter7ShowFriendRequests(event.items || [], 0);
        } else if (event.type === "privateChat") {
            chapter7StartChat("张桂源", event.messages || [], []);
        } else if (event.type === "groupChat") {
            chapter7StartChat("everybody 棒棒", event.messages || [], event.incoming || []);
        } else if (event.type === "choice") {
            chapter7ShowChoice(event.options || []);
        }
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

    function chapter7StartChat(contact, messages, incoming) {
        if (!chatData[contact]) chatData[contact] = { messages: [], newMsg: false };
        var data = chatData[contact];
        data.chapter7ChatActive = true;
        data.newMsg = true;
        (incoming || []).forEach(function (message, index) {
            if (message.withdrawn) {
                chapter7PushMessage(contact, { from: "system", text: message.text, time: chapter7MessageTime(index), date: "2025年5月31日", read: false, chapter7: true });
            } else {
                chapter7PushMessage(contact, { from: message.from, groupSender: message.from, text: replaceChapter7Tokens(message.text), avatar: chapter4GroupAvatarPath(message.from), time: chapter7MessageTime(index), date: "2025年5月31日", read: false, chapter7: true });
            }
        });
        window.chapter7PendingChat = { contact: contact, messages: messages.map(replaceChapter7Tokens), index: 0 };
        switchPage("chat");
        window.openChapter7Chat(contact);
        setTimeout(chapter7ShowNextOutgoingOption, 500);
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

    function chapter7ShowChoice(options) {
        var overlay = document.getElementById("chapter7StoryOverlay");
        if (!overlay || overlay.querySelector(".chapter7-story-options")) return;
        document.getElementById("chapter7Continue").textContent = "请做出选择";
        var wrap = document.createElement("div");
        wrap.className = "chapter7-story-options";
        options.forEach(function (option, index) {
            var button = document.createElement("button");
            button.className = "chapter7-story-option";
            button.innerHTML = "<strong>" + (index + 1) + ". " + replaceChapter7Tokens(option.title) + "</strong><span>" + replaceChapter7Tokens(option.description) + "</span>";
            button.onclick = function (event) {
                event.stopPropagation();
                localStorage.setItem("chapter7_first_choice", String(index));
                wrap.querySelectorAll("button").forEach(function (item) { item.disabled = true; item.style.opacity = ".45"; });
                button.style.opacity = "1";
                document.getElementById("chapter7Continue").textContent = "选择已记录，后续剧情待更新";
                if (typeof autoSaveGame === "function") autoSaveGame();
            };
            wrap.appendChild(button);
        });
        overlay.appendChild(wrap);
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
    };

    window.closeChapter7Story = function () {
        window.suspendChapter7Story();
        document.getElementById("storyDetailPage").style.display = "none";
        document.getElementById("chapterSelectPage").style.display = "block";
        renderChapterList();
    };
})();
