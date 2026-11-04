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
    window.chapter7EndingReached = false;
    window.chapter7VisitedPlaces = {};
    window.chapter7ExploreChoiceEvent = null;
    window.chapter7DogName = localStorage.getItem("chapter7_dog_name") || "豆包";
    window.chapter7CatName = localStorage.getItem("chapter7_cat_name") || "年糕";
    window.chapter7RouteBgm = null;

    var chapter7TraceNodes = [
        { key:"root", kind:"choice", route:"intro", id:"main_path", title:"中考后的选择", x:30, y:430 },
        { key:"contact", parent:"root", kind:"choice", route:"abroad", id:"keep_contact", title:"是否保留联系方式", x:250, y:170 },
        { key:"country", parent:"contact", kind:"choice", route:"keep_contact_after_pov", id:"country_after_high_school", title:"高中毕业后的去向", x:470, y:80 },
        { key:"hotel", parent:"country", kind:"choice", route:"return_china_intro", id:"hotel_invitation", title:"深夜酒店邀约", x:690, y:20 },
        { key:"like", parent:"hotel", kind:"choice", route:"return_hotel_common", id:"still_like_zhang", title:"是否还喜欢张桂源", x:910, y:20 },
        { key:"live", parent:"like", kind:"choice", route:"return_relationship_common", id:"birthday_livestream", title:"生日直播互动", x:1130, y:20 },
        { key:"role", parent:"live", kind:"choice", route:"return_live_common", id:"return_relationship_role", title:"这段关系的定位", x:1350, y:20 },
        { key:"loser", parent:"role", kind:"ending", title:"败犬", x:1570, y:0 },
        { key:"sinking", parent:"role", kind:"ending", title:"沉沦夜色", x:1570, y:80 },
        { key:"video", parent:"country", kind:"choice", route:"stay_abroad", id:"video_reply", title:"视频后的回复", x:690, y:160 },
        { key:"some_day", parent:"video", kind:"ending", title:"某年某月某天", x:910, y:125 },
        { key:"stranger", parent:"video", kind:"ending", title:"最熟悉的陌生人", x:910, y:205 },
        { key:"wedding", parent:"contact", kind:"choice", route:"no_contact", id:"wedding_style", title:"婚礼风格", x:470, y:300 },
        { key:"chinese", parent:"wedding", kind:"ending", title:"凤冠霞帔，共赴白首", x:690, y:260 },
        { key:"lawn", parent:"wedding", kind:"ending", title:"草坪上的誓言", x:690, y:340 },
        { key:"western", parent:"wedding", kind:"ending", title:"以余生之名", x:690, y:420 },
        { key:"expose", parent:"root", kind:"ending", title:"陌路", x:250, y:500 },
        { key:"find", parent:"root", kind:"choice", route:"find_zhang_common", id:"find_zhang_persist", title:"寻找张桂源", x:250, y:700 },
        { key:"borrow", parent:"find", kind:"ending", title:"借过", x:470, y:580 },
        { key:"left", parent:"find", kind:"choice", route:"find_zhang_keep", id:"like_zuoqihan", title:"左奇函的感情", x:470, y:760 },
        { key:"forever", parent:"left", kind:"ending", title:"永远在一起", x:690, y:680 },
        { key:"forever_extra", parent:"forever", kind:"extra", route:"forever_extra", title:"《永远在一起》番外", x:910, y:680 },
        { key:"homeward", parent:"left", kind:"ending", title:"归途", x:690, y:840 },
        { key:"homeward_extra", parent:"homeward", kind:"extra", route:"homeward_extra", title:"《归途》番外", x:910, y:840 }
    ];

    function replaceChapter7Tokens(text) {
        var currentPlayer = typeof player !== "undefined" ? player : {};
        var playerName = currentPlayer.name || "你";
        var playerNickname = currentPlayer.nickname || currentPlayer.name || "你";
        var wechatName = currentPlayer.wechatName || currentPlayer.name || "你";
        var chars = Array.from(playerName);
        var lastChar = chars.length ? chars[chars.length - 1] : "你";
        return String(text || "")
            .replace(/\{\{PLAYER_WECHAT_NAME\}\}/g, wechatName)
            .replace(/\{\{PLAYER_LAST_CHAR\}\}/g, lastChar)
            .replace(/\{\{PLAYER_NAME\}\}/g, playerName)
            .replace(/\{\{PLAYER_NICKNAME\}\}/g, playerNickname)
            .replace(/\{\{DOG_NAME\}\}/g, window.chapter7DogName || "豆包")
            .replace(/\{\{CAT_NAME\}\}/g, window.chapter7CatName || "年糕");
    }

    function ensureChapter7Style() {
        if (document.getElementById("chapter7StoryStyle")) return;
        var style = document.createElement("style");
        style.id = "chapter7StoryStyle";
        style.textContent =
            '#chapter7StoryOverlay{position:fixed;top:0;bottom:70px;left:50%;transform:translateX(-50%);width:100%;max-width:500px;z-index:94;background:#111 center/cover no-repeat;overflow:hidden}' +
            '#chapter7BackBtn{position:absolute;top:max(18px,env(safe-area-inset-top));left:18px;width:42px;height:42px;border:0;border-radius:50%;background:rgba(0,0,0,.58);color:#fff;font-size:25px;z-index:8}' +
            '#chapter7TraceBtn{position:absolute;top:max(18px,env(safe-area-inset-top));right:18px;height:42px;padding:0 15px;border:1px solid rgba(255,255,255,.35);border-radius:21px;background:rgba(0,0,0,.58);color:#fff;font-size:13px;z-index:8}' +
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
            '.chapter7-ending-transition{position:absolute;inset:0;z-index:29;display:flex;align-items:center;justify-content:center;background:#050505;color:#fff;font-family:Georgia,Times New Roman,serif;font-size:48px;font-weight:700;letter-spacing:8px;opacity:0;transform:translateY(54px);transition:opacity .85s ease,transform 1.1s ease}.chapter7-ending-transition.show{opacity:1;transform:translateY(0)}' +
            '#chapter7ActionModal{position:fixed;inset:0;z-index:10020;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.45);padding:24px}#chapter7ActionModal .panel{width:min(330px,88vw);overflow:hidden;border-radius:12px;background:#fff;color:#222;text-align:center;box-shadow:0 16px 48px rgba(0,0,0,.3)}#chapter7ActionModal h3{margin:22px 18px 10px;font-size:18px}#chapter7ActionModal p{margin:0 22px 22px;color:#666;font-size:14px;line-height:1.55}#chapter7ActionModal .buttons{display:grid;grid-template-columns:1fr 1fr;border-top:1px solid #eee}#chapter7ActionModal button{height:48px;border:0;background:#fff;font-size:15px}#chapter7ActionModal button+button{border-left:1px solid #eee;color:#e34e64;font-weight:600}#chapter7PetNameModal{position:absolute;inset:0;z-index:45;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.72);padding:24px}#chapter7PetNameModal .panel{width:min(330px,90%);padding:22px;border-radius:14px;background:#fff;color:#222;box-shadow:0 18px 55px rgba(0,0,0,.38)}#chapter7PetNameModal h3{margin:0 0 8px;text-align:center}#chapter7PetNameModal p{margin:0 0 16px;color:#777;text-align:center;font-size:12px}#chapter7PetNameModal label{display:block;margin:10px 0 5px;font-size:13px}#chapter7PetNameModal input{box-sizing:border-box;width:100%;height:42px;padding:0 12px;border:1px solid #ddd;border-radius:8px;font-size:15px}#chapter7PetNameModal .buttons{display:flex;gap:10px;margin-top:18px}#chapter7PetNameModal button{flex:1;height:42px;border:0;border-radius:8px;background:#eee}#chapter7PetNameModal button.confirm{background:#e85f78;color:#fff}';
        style.textContent += '#chapter7MiniPhoneWrap{position:absolute;inset:0;z-index:40;background:rgba(0,0,0,.76);display:flex;align-items:center;justify-content:center;flex-direction:column;gap:10px}#chapter7MiniPhone{width:min(310px,82vw);height:min(620px,72vh);border:9px solid #181818;border-radius:32px;background:#f3f3f3;overflow:hidden;box-shadow:0 20px 60px #000;position:relative;color:#222}#chapter7PhoneLock{position:absolute;inset:0;background:linear-gradient(150deg,#2c3347,#9c727b);color:#fff;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;padding:45px 20px;font-size:13px;touch-action:none}#chapter7PhoneLock b{position:absolute;top:70px;font-size:42px;font-weight:300}#chapter7PhoneHome{display:none;height:100%;padding:65px 22px 22px;background:linear-gradient(150deg,#d6ddeb,#e8cad0)}.chapter7-phone-apps{display:grid;grid-template-columns:1fr 1fr;gap:28px 22px}.chapter7-phone-app{border:0;background:none;font-size:13px;color:#222}.chapter7-phone-app i{display:flex;width:58px;height:58px;margin:0 auto 7px;border-radius:14px;background:#fff;align-items:center;justify-content:center;font-style:normal;font-size:27px;box-shadow:0 3px 10px rgba(0,0,0,.18)}#chapter7PhonePage{display:none;height:100%;background:#fff;overflow:auto;padding:52px 15px 18px}#chapter7PhonePage h3{margin:0 0 18px;text-align:center;font-size:17px}#chapter7PhonePage .phone-back{position:absolute;left:18px;top:18px;border:0;background:none;font-size:24px}.phone-card{padding:12px;margin-bottom:12px;border-radius:10px;background:#f2f2f2;font-size:12px;line-height:1.65}.phone-card b{display:block;margin-bottom:5px}.phone-thread-row{display:flex;align-items:center;gap:11px;padding:12px 4px;border-bottom:1px solid #eee;cursor:pointer}.phone-thread-row .thread-icon{width:42px;height:42px;border-radius:9px;background:#75a17a;color:#fff;display:flex;align-items:center;justify-content:center;font-size:20px;flex:0 0 auto}.phone-thread-row .thread-main{min-width:0;flex:1}.phone-thread-row b{display:block;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.phone-thread-row span{display:block;margin-top:4px;color:#999;font-size:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.phone-msg{max-width:78%;padding:9px 11px;margin:7px 0;border-radius:12px;background:#eee;font-size:12px;line-height:1.5;clear:both}.phone-msg.right{float:right;background:#95ec69}.phone-msg.center{max-width:100%;margin:8px auto;text-align:center;background:none;color:#999}.phone-msg small{display:block;color:#888;margin-bottom:3px}.phone-post{padding:14px 0;border-bottom:1px solid #eee;font-size:12px;line-height:1.65}.phone-post b{display:block;font-size:14px;margin-bottom:7px}#chapter7PutPhoneDown{border:1px solid rgba(255,255,255,.6);border-radius:18px;background:rgba(0,0,0,.7);color:#fff;padding:8px 24px;font-size:13px}';
        style.textContent += '#chapter7TipModal,#chapter7TraceModal{position:absolute;inset:0;z-index:80;display:flex;align-items:center;justify-content:center;padding:20px;background:rgba(0,0,0,.76)}#chapter7TipModal .panel{width:min(340px,92%);padding:24px 20px;border:1px solid rgba(255,255,255,.28);border-radius:16px;background:#17171b;color:#fff;text-align:center;box-shadow:0 18px 55px #000}#chapter7TipModal h3{margin:0 0 14px;font-size:20px}#chapter7TipModal p{margin:0;color:#ddd;font-size:14px;line-height:1.9}#chapter7TipModal button{width:100%;margin-top:20px;padding:11px;border:0;border-radius:22px;background:#e85f78;color:#fff;font-size:14px}#chapter7TraceModal{padding:0;background:#f7f3f8}#chapter7TraceModal .trace-panel{position:relative;width:100%;height:100%;background:linear-gradient(#faf8fb,#f4eff6);color:#222;overflow:hidden;touch-action:none}#chapter7TraceModal .trace-title{position:absolute;z-index:4;top:17px;left:20px;font-size:18px;font-weight:700;color:#382d3d}#chapter7TraceHint{position:absolute;z-index:4;top:44px;left:20px;color:#8d8091;font-size:11px}#chapter7TraceClose{position:absolute;z-index:5;top:13px;right:14px;width:38px;height:38px;border:0;border-radius:50%;background:#fff;color:#4f4053;font-size:22px;box-shadow:0 3px 14px rgba(73,47,78,.16)}#chapter7TraceViewport{position:absolute;inset:70px 0 0;overflow:hidden;cursor:grab}#chapter7TraceViewport.dragging{cursor:grabbing}#chapter7TraceStage{position:absolute;left:0;top:0;width:1800px;height:930px;transform-origin:0 0;will-change:transform}#chapter7TraceLines{position:absolute;inset:0;width:1800px;height:930px;overflow:visible}.chapter7-trace-line{fill:none;stroke:#8a728f;stroke-width:2}.chapter7-trace-node{position:absolute;width:176px;min-height:58px;padding:11px 13px;border:1px solid #cdbdd2;border-radius:9px;background:#eadff0;color:#58495d;text-align:center;box-shadow:0 3px 9px rgba(83,56,88,.11)}.chapter7-trace-node.played{border-color:#df6480;background:linear-gradient(135deg,#f59ab0,#dd667f);color:#fff;box-shadow:0 0 16px rgba(224,86,116,.28)}.chapter7-trace-node.choice{cursor:pointer}.chapter7-trace-node.choice:not(.played){background:#f5d9a5;border-color:#d8ae5d;color:#624c24}.chapter7-trace-node.extra:not(.played){background:#e5d9e9}.chapter7-trace-node small{display:block;margin-top:4px;color:inherit;font-size:10px;opacity:.74}';
        document.head.appendChild(style);
    }

    window.openChapter7Story = function () {
        if (window.chapter7EndingReached) {
            window.chapter7SessionActive = false;
            window.chapter7EndingReached = false;
            var finishedOverlay = document.getElementById("chapter7StoryOverlay");
            if (finishedOverlay) finishedOverlay.remove();
        }
        if (window.chapter7SessionActive) {
            window.restoreChapter7Story();
            return;
        }
        window.chapter7SessionActive = true;
        window.chapter7RouteId = "intro";
        window.chapter7SequenceIndex = 0;
        window.chapter7CurrentPage = null;
        window.chapter7PendingChat = null;
        window.chapter7VisitedPlaces = {};
        window.chapter7ExploreChoiceEvent = null;
        ensureChapter7Style();
        var old = document.getElementById("chapter7StoryOverlay");
        if (old) old.remove();
        var overlay = document.createElement("div");
        overlay.id = "chapter7StoryOverlay";
        overlay.innerHTML = '<button id="chapter7BackBtn">←</button><button id="chapter7TraceBtn">回溯</button><div id="chapter7PerspectiveBadge">张桂源视角</div><div id="chapter7TextBox"><button id="chapter7SkipBtn">Skip</button><div id="chapter7NamePlate"></div><div id="chapter7Text"></div><div id="chapter7Continue">点击继续</div></div><div id="chapter7Opening"><div class="chapter-no">第七章</div><div class="chapter-name">梦哑</div></div>';
        document.getElementById("gameScreen").appendChild(overlay);
        document.getElementById("chapter7BackBtn").onclick = function (event) {
            event.stopPropagation();
            window.closeChapter7Story();
        };
        document.getElementById("chapter7TextBox").onclick = chapter7HandleTextBoxClick;
        document.getElementById("chapter7TraceBtn").onclick = function (event) { event.stopPropagation(); chapter7ShowTrace(); };
        installChapter7LongPress();
        document.getElementById("chapter7SkipBtn").onclick = function (event) {
            event.stopPropagation();
            chapter7SkipToNextChoice();
        };
        chapter7ShowTip(function () {
            var opening = document.getElementById("chapter7Opening");
            requestAnimationFrame(function () { requestAnimationFrame(function () { opening.style.opacity = "1"; }); });
            setTimeout(function () { opening.style.opacity = "0"; }, 1750);
            setTimeout(function () { opening.remove(); chapter7AdvanceSequence(); }, 2500);
        });
    };

    function chapter7ShowTip(done) {
        var overlay = document.getElementById("chapter7StoryOverlay"), modal = document.createElement("div");
        modal.id = "chapter7TipModal";
        modal.innerHTML = '<div class="panel"><h3>食用提示</h3><p>长按可以进行剧情加速，点击 Skip 能够跳转到下一个选项，左上角的回溯可以快速体验其他结局。<br>含有部分语音和 BGM，可以开启声音食用哦～</p><button type="button">知道了，开始剧情</button></div>';
        overlay.appendChild(modal);
        modal.querySelector("button").onclick = function () { modal.remove(); done(); };
    }

    function chapter7NodePlayed(node) {
        if (node.kind === "ending") return localStorage.getItem("chapter7_ending_" + node.title) === "1";
        if (node.kind === "choice") return localStorage.getItem("chapter7_choice_" + node.id) !== null;
        return localStorage.getItem("chapter7_route_" + node.route) === "1";
    }
    function chapter7ShowTrace() {
        var overlay = document.getElementById("chapter7StoryOverlay");
        if (!overlay || document.getElementById("chapter7TraceModal")) return;
        var modal = document.createElement("div");
        modal.id = "chapter7TraceModal";
        modal.innerHTML = '<div class="trace-panel"><div class="trace-title">剧情回溯</div><div id="chapter7TraceHint">拖动查看 · 双指缩放 · 点击分歧跳转</div><button id="chapter7TraceClose">×</button><div id="chapter7TraceViewport"><div id="chapter7TraceStage"><svg id="chapter7TraceLines" viewBox="0 0 1800 930"></svg><div id="chapter7TraceTree"></div></div></div></div>';
        overlay.appendChild(modal);
        var tree = modal.querySelector("#chapter7TraceTree"), lines = modal.querySelector("#chapter7TraceLines");
        var nodeMap = {};
        chapter7TraceNodes.forEach(function (node) { nodeMap[node.key] = node; });
        chapter7TraceNodes.forEach(function (node) {
            if (!node.parent || !nodeMap[node.parent]) return;
            var parent = nodeMap[node.parent], startX = parent.x + 176, startY = parent.y + 29, endX = node.x, endY = node.y + 29, middle = (startX + endX) / 2;
            var path = document.createElementNS("http://www.w3.org/2000/svg", "path");
            path.setAttribute("class", "chapter7-trace-line");
            path.setAttribute("d", "M" + startX + " " + startY + " C" + middle + " " + startY + "," + middle + " " + endY + "," + endX + " " + endY);
            lines.appendChild(path);
        });
        chapter7TraceNodes.forEach(function (node) {
            var played = chapter7NodePlayed(node), button = document.createElement("button");
            button.className = "chapter7-trace-node " + node.kind + (played ? " played" : "");
            button.style.left = node.x + "px"; button.style.top = node.y + "px";
            button.innerHTML = '<b>' + (node.kind === "ending" && !played ? "？？？" : chapter7EscapeHtml(node.title)) + '</b><small>' + (node.kind === "choice" ? "选项分歧 · 点击跳转" : node.kind === "extra" ? "番外" : "结局") + '</small>';
            if (node.kind === "choice") button.onclick = function () {
                var sequence = window.chapter7Routes[node.route] || [];
                var index = sequence.findIndex(function (event) { return event.type === "choice" && event.id === node.id; });
                if (index < 0) return;
                modal.remove();
                overlay.querySelectorAll(".chapter7-story-options,.chapter7-ending,.chapter7-ending-transition").forEach(function (element) { element.remove(); });
                window.chapter7PendingChat = null; window.chapter7PendingRequiredAction = null; window.chapter7PendingExposureWeibo = null;
                chapter7SetRoute(node.route, false); window.chapter7SequenceIndex = index; chapter7AdvanceSequence();
            }; else button.disabled = true;
            tree.appendChild(button);
        });
        var viewport = modal.querySelector("#chapter7TraceViewport"), stage = modal.querySelector("#chapter7TraceStage");
        var traceScale = Math.min(.72, Math.max(.48, viewport.clientWidth / 850)), traceX = 18, traceY = 10, pointers = {}, lastDistance = 0, lastCenter = null;
        function renderTransform() { stage.style.transform = "translate(" + traceX + "px," + traceY + "px) scale(" + traceScale + ")"; }
        function pointerCenter() { var values = Object.keys(pointers).map(function (key) { return pointers[key]; }); return { x:(values[0].x+values[1].x)/2, y:(values[0].y+values[1].y)/2 }; }
        viewport.onpointerdown = function (event) { pointers[event.pointerId] = {x:event.clientX,y:event.clientY}; viewport.setPointerCapture(event.pointerId); if (Object.keys(pointers).length === 1) viewport.classList.add("dragging"); };
        viewport.onpointermove = function (event) {
            var previous = pointers[event.pointerId]; if (!previous) return;
            pointers[event.pointerId] = {x:event.clientX,y:event.clientY}; var keys = Object.keys(pointers);
            if (keys.length === 1 && !event.target.closest(".chapter7-trace-node")) { traceX += event.clientX-previous.x; traceY += event.clientY-previous.y; renderTransform(); }
            if (keys.length >= 2) {
                var a=pointers[keys[0]], b=pointers[keys[1]], distance=Math.hypot(a.x-b.x,a.y-b.y), center=pointerCenter();
                if (lastDistance && lastCenter) { var nextScale=Math.min(2.4,Math.max(.35,traceScale*(distance/lastDistance))); traceX=center.x-(center.x-traceX)*(nextScale/traceScale)+(center.x-lastCenter.x); traceY=center.y-(center.y-traceY)*(nextScale/traceScale)+(center.y-lastCenter.y); traceScale=nextScale; renderTransform(); }
                lastDistance=distance; lastCenter=center;
            }
        };
        function releasePointer(event) { delete pointers[event.pointerId]; viewport.classList.remove("dragging"); if (Object.keys(pointers).length < 2) { lastDistance=0; lastCenter=null; } }
        viewport.onpointerup = releasePointer; viewport.onpointercancel = releasePointer;
        renderTransform();
        modal.querySelector("#chapter7TraceClose").onclick = function () { modal.remove(); };
    }

    function chapter7ShowPage(page) {
        clearInterval(window.chapter7TypingTimer);
        window.chapter7TypingTimer = null;
        window.chapter7CurrentPage = page;
        if (String(page.text || "").indexOf("最折磨你的，其实并不是这些") === 0) chapter7StartDreamAudio();
        var overlay = document.getElementById("chapter7StoryOverlay");
        if (!overlay) return;
        var backgroundName = page.text === "学校那边的情况也越来越糟。" ? "bj1.jpg" : (page.bg || "wdws.jpg");
        if (backgroundName === "__white__" || backgroundName === "__black__") {
            overlay.style.backgroundImage = "none";
            overlay.style.backgroundColor = backgroundName === "__black__" ? "#000" : "#fff";
        } else {
            var backgroundSource = (window.chapter7EmbeddedBackgrounds && window.chapter7EmbeddedBackgrounds[backgroundName]) || backgroundName;
            if (!/^data:/.test(backgroundSource) && backgroundSource.indexOf("?") === -1) backgroundSource += "?v=20261102a";
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
        if (window.chapter7PendingRequiredAction && !window.chapter7PendingRequiredAction.confirmed) {
            var requiredLabel = window.chapter7PendingRequiredAction.actionType === "delete" ? "请先删除张桂源后继续剧情" : "请先退出群聊后继续剧情";
            document.getElementById("chapter7Continue").textContent = requiredLabel;
            showMessageNotification("第七章剧情", '<span style="font-size:28px">📖</span>', "提示", requiredLabel, function () {});
            return;
        }
        if (window.chapter7PendingChat) {
            var pendingLabel = window.chapter7PendingChat.contact === "everybody 棒棒" ? "请先点击群聊并完成聊天" : "请先进入聊天页面并完成聊天";
            document.getElementById("chapter7Continue").textContent = pendingLabel;
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
            chapter7UnlockDreamAudio();
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
        localStorage.setItem("chapter7_route_" + routeId, "1");
        if (typeof perspective === "boolean") window.chapter7PerspectiveMode = perspective;
        var badge = document.getElementById("chapter7PerspectiveBadge");
        if (badge) badge.style.display = window.chapter7PerspectiveMode ? "block" : "none";
        if (typeof autoSaveGame === "function") autoSaveGame();
        return true;
    }

    function chapter7StartDreamAudio() {
        window.chapter7DreamAudioShouldPlay = true;
        if (!window.chapter7DreamAudio) {
            window.chapter7DreamAudio = new Audio("mengya.mp3?v=20261101a");
            window.chapter7DreamAudio.loop = true;
            window.chapter7DreamAudio.volume = 0.55;
        }
        window.chapter7DreamAudio.play().catch(function () {});
    }

    function chapter7UnlockDreamAudio() {
        if (window.chapter7DreamAudioUnlocked) return;
        if (!window.chapter7DreamAudio) {
            window.chapter7DreamAudio = new Audio("mengya.mp3?v=20261102a");
            window.chapter7DreamAudio.loop = true;
        }
        window.chapter7DreamAudio.volume = 0;
        var promise = window.chapter7DreamAudio.play();
        if (promise && promise.then) promise.then(function () {
            window.chapter7DreamAudioUnlocked = true;
            if (window.chapter7DreamAudioShouldPlay) window.chapter7DreamAudio.volume = 0.55;
            else {
                window.chapter7DreamAudio.pause();
                window.chapter7DreamAudio.currentTime = 0;
                window.chapter7DreamAudio.volume = 0.55;
            }
        }).catch(function () {});
    }

    function chapter7StopDreamAudio() {
        window.chapter7DreamAudioShouldPlay = false;
        if (!window.chapter7DreamAudio) return;
        window.chapter7DreamAudio.pause();
        window.chapter7DreamAudio.currentTime = 0;
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
            chapter7StartChat(event.contact || "张桂源", event.messages || [], [], event.bg);
        } else if (event.type === "scriptedChat") {
            chapter7StartScriptedChat(event.contact || "WXYz", event.entries || [], event.bg, event.notifications || [], !!event.preloadFirstIncoming, event.preloadCount || 0, event.choice || null);
        } else if (event.type === "friendRequestChat") {
            chapter7ShowStoryFriendRequest(event, true);
        } else if (event.type === "friendRequestOnly") {
            chapter7ShowStoryFriendRequest(event, false);
        } else if (event.type === "exploreChoice") {
            chapter7ShowExploreChoice(event);
        } else if (event.type === "exploreReturn") {
            var visitedCount = Object.keys(window.chapter7VisitedPlaces || {}).length;
            if (visitedCount >= 2 && chapter7SetRoute(event.commonRoute, false)) chapter7AdvanceSequence();
            else chapter7ShowExploreChoice(window.chapter7ExploreChoiceEvent);
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
        } else if (event.type === "endingContinue") {
            chapter7ShowEndingContinue(event);
        } else if (event.type === "chapterExit") {
            chapter7ExitToHome();
        } else if (event.type === "deleteContactPrompt") {
            chapter7StartRequiredAction(event.contact || "张桂源", "delete");
        } else if (event.type === "groupExitPrompt") {
            chapter7StartRequiredAction(event.contact || "everybody 棒棒", "exit");
        } else if (event.type === "exposureWeibo") {
            chapter7StartExposureWeibo(event);
        } else if (event.type === "exposureArtistWeibo") {
            chapter7StartExposureArtistWeibo(event);
        } else if (event.type === "endingTransition") {
            chapter7ShowEndingTransition(event);
        } else if (event.type === "embeddedPhone") {
            chapter7ShowEmbeddedPhone(event);
        } else if (event.type === "petNamePrompt") {
            chapter7ShowPetNamePrompt();
        } else if (event.type === "audioStart") {
            chapter7StartRouteBgm(event);
            chapter7AdvanceSequence();
        } else if (event.type === "audioFadeOut") {
            chapter7FadeRouteBgm(event.duration || 1800);
            chapter7AdvanceSequence();
        }
    }

    function chapter7StartRouteBgm(event) {
        chapter7FadeRouteBgm(250);
        var source = event.src || "bxna-small.mp3";
        if (source.indexOf("?") === -1) source += "?v=20261104f";
        var audio = new Audio(source);
        audio.preload = "auto";
        audio.loop = true;
        audio.volume = typeof event.volume === "number" ? event.volume : 0.48;
        audio.onerror = function () {
            if (audio.dataset.fallback) return;
            audio.dataset.fallback = "1";
            audio.src = "bxna.mp3";
            audio.play().catch(function () {});
        };
        window.chapter7RouteBgm = audio;
        function playRouteBgm() {
            if (window.chapter7RouteBgm !== audio) return;
            var promise = audio.play();
            if (promise && promise.catch) promise.catch(function () {
                window.chapter7PendingBgmResume = audio;
            });
        }
        playRouteBgm();
        if (!window.chapter7BgmResumeBound) {
            window.chapter7BgmResumeBound = true;
            document.addEventListener("pointerdown", function () {
                var pending = window.chapter7PendingBgmResume;
                if (!pending || pending !== window.chapter7RouteBgm) return;
                var promise = pending.play();
                if (promise && promise.then) promise.then(function () {
                    if (window.chapter7PendingBgmResume === pending) window.chapter7PendingBgmResume = null;
                }).catch(function () {});
            }, true);
        }
    }

    function chapter7FadeRouteBgm(duration) {
        var audio = window.chapter7RouteBgm;
        if (!audio) return;
        var startVolume = audio.volume, started = Date.now();
        var timer = setInterval(function () {
            var ratio = Math.min(1, (Date.now() - started) / duration);
            audio.volume = Math.max(0, startVolume * (1 - ratio));
            if (ratio >= 1) {
                clearInterval(timer);
                audio.pause();
                audio.currentTime = 0;
                if (window.chapter7RouteBgm === audio) window.chapter7RouteBgm = null;
            }
        }, 60);
    }

    function chapter7ShowPetNamePrompt() {
        var overlay = document.getElementById("chapter7StoryOverlay");
        if (!overlay) return;
        var modal = document.createElement("div");
        modal.id = "chapter7PetNameModal";
        modal.innerHTML = '<div class="panel"><h3>给它们取名字</h3><p>可以自定义，也可以使用默认名字</p><label>小狗的名字</label><input id="chapter7DogNameInput" maxlength="8" placeholder="豆包"><label>小猫的名字</label><input id="chapter7CatNameInput" maxlength="8" placeholder="年糕"><div class="buttons"><button type="button" data-role="default">使用默认</button><button type="button" class="confirm" data-role="confirm">确定</button></div></div>';
        overlay.appendChild(modal);
        function finish(useDefault) {
            var dog = useDefault ? "豆包" : modal.querySelector("#chapter7DogNameInput").value.trim();
            var cat = useDefault ? "年糕" : modal.querySelector("#chapter7CatNameInput").value.trim();
            window.chapter7DogName = dog || "豆包";
            window.chapter7CatName = cat || "年糕";
            localStorage.setItem("chapter7_dog_name", window.chapter7DogName);
            localStorage.setItem("chapter7_cat_name", window.chapter7CatName);
            modal.remove();
            chapter7AdvanceSequence();
        }
        modal.querySelector('[data-role="default"]').onclick = function(){ finish(true); };
        modal.querySelector('[data-role="confirm"]').onclick = function(){ finish(false); };
    }

    function chapter7ShowEmbeddedPhone(event) {
        var overlay = document.getElementById("chapter7StoryOverlay");
        if (!overlay) return;
        var wrap = document.createElement("div");
        wrap.id = "chapter7MiniPhoneWrap";
        wrap.innerHTML = '<div id="chapter7MiniPhone"><div id="chapter7PhoneLock"><b>22:18</b><span>向上滑动解锁</span></div><div id="chapter7PhoneHome"><div class="chapter7-phone-apps"><button class="chapter7-phone-app" data-app="notes"><i>📝</i>备忘录</button><button class="chapter7-phone-app" data-app="messages"><i>💬</i>信息</button><button class="chapter7-phone-app" data-app="browser"><i>🌐</i>浏览器</button><button class="chapter7-phone-app" data-app="xhs"><i>📕</i>小红书</button></div></div><div id="chapter7PhonePage"></div></div><button id="chapter7PutPhoneDown">放下手机</button>';
        overlay.appendChild(wrap);
        var lock = wrap.querySelector("#chapter7PhoneLock"), startY = 0;
        function unlock() { lock.style.transform = "translateY(-100%)"; lock.style.transition = "transform .45s"; wrap.querySelector("#chapter7PhoneHome").style.display = "block"; }
        lock.addEventListener("touchstart", function(e){ startY = e.touches[0].clientY; }, {passive:true});
        lock.addEventListener("touchend", function(e){ if (startY - e.changedTouches[0].clientY > 35) unlock(); });
        lock.addEventListener("mousedown", function(e){ startY = e.clientY; });
        lock.addEventListener("mouseup", function(e){ if (startY - e.clientY > 20) unlock(); });
        var page = wrap.querySelector("#chapter7PhonePage"), home = wrap.querySelector("#chapter7PhoneHome");
        function esc(v){ return chapter7EscapeHtml(replaceChapter7Tokens(v)); }
        function openApp(name) {
            var html = '<button class="phone-back">‹</button>';
            if (name === "notes") { html += '<h3>备忘录</h3>' + (event.notes||[]).map(function(n){return '<div class="phone-card"><b>'+esc(n.title)+'</b>'+n.body.map(esc).join('<br>')+'</div>';}).join(''); }
            if (name === "messages") {
                function renderMessageList() {
                    var listHtml = '<button class="phone-back">‹</button><h3>信息</h3>' + (event.messages || []).map(function(thread, index) {
                        var title = thread.title === "聊天记录" ? "张桂源" : thread.title.replace(/^\d+\.\s*/, "").replace(/[｜/].*$/, "");
                        var isGroup = /群聊/.test(thread.title);
                        var preview = thread.items && thread.items.length ? thread.items[thread.items.length - 1].text : "";
                        return '<div class="phone-thread-row" data-thread="' + index + '"><i class="thread-icon">' + (isGroup ? '👥' : '👤') + '</i><div class="thread-main"><b>' + esc(title) + '</b><span>' + esc(preview) + '</span></div></div>';
                    }).join('');
                    page.innerHTML = listHtml;
                    page.querySelector(".phone-back").onclick = function(){ page.style.display="none"; home.style.display="block"; };
                    page.querySelectorAll("[data-thread]").forEach(function(row){ row.onclick=function(){ renderMessageThread((event.messages || [])[Number(row.dataset.thread)]); }; });
                }
                function renderMessageThread(thread) {
                    page.innerHTML = '<button class="phone-back">‹</button><h3>' + esc(thread.title === "聊天记录" ? "张桂源" : thread.title.replace(/^\d+\.\s*/, "")) + '</h3>' + (thread.items || []).map(function(m){return '<div class="phone-msg '+m.side+'"><small>'+esc(m.sender)+'</small>'+esc(m.text)+'</div><div style="clear:both"></div>';}).join('');
                    page.querySelector(".phone-back").onclick = renderMessageList;
                    page.scrollTop = 0;
                }
                page.style.display = "block"; home.style.display = "none";
                renderMessageList();
                return;
            }
            if (name === "browser") { html += '<h3>浏览器历史记录</h3>' + (event.browser||[]).map(function(x){return '<div class="phone-card">🔍 '+esc(x)+'</div>';}).join(''); }
            if (name === "xhs") { html += '<h3>小红书</h3>' + (event.xhs||[]).map(function(p){return '<div class="phone-post"><b>'+esc(p.title)+'</b>'+p.lines.map(esc).join('<br>')+'</div>';}).join(''); }
            page.innerHTML = html; home.style.display = "none"; page.style.display = "block";
            page.querySelector(".phone-back").onclick = function(){ page.style.display="none"; home.style.display="block"; };
        }
        wrap.querySelectorAll("[data-app]").forEach(function(btn){ btn.onclick=function(){openApp(btn.dataset.app);}; });
        wrap.querySelector("#chapter7PutPhoneDown").onclick = function(){ wrap.remove(); chapter7AdvanceSequence(); };
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
        var timeline = post.timeline || [];
        if (!timeline.length) {
            (post.userComments || []).forEach(function (item) { timeline.push({ kind: "user", entry: typeof item === "string" ? { text: item } : item }); });
            (post.fixedComments || []).forEach(function (text) { timeline.push({ kind: "fixed", text: text }); });
        }
        var fixedNumber = 0;
        timeline.forEach(function (item) {
            if (item.kind === "user") {
                var entry = item.entry || { text: "" };
                comments += '<div style="padding:7px 0;border-bottom:1px solid #f2f2f2;font-size:13px"><b>' + chapter7EscapeHtml((player && (player.weiboName || player.name)) || "你") + '</b>：' + chapter7EscapeHtml(entry.text) + (entry.image ? '<div style="margin-top:7px"><img src="' + chapter7EscapeHtml(entry.image) + '" style="display:block;max-width:160px;max-height:180px;border-radius:6px;object-fit:cover"></div>' : "") + '</div>';
            } else {
                fixedNumber += 1;
                comments += '<div style="padding:7px 0;border-bottom:1px solid #f2f2f2;font-size:13px"><b>网友' + fixedNumber + '</b>：' + chapter7EscapeHtml(item.text) + '</div>';
            }
        });
        var actions = pending.revealing
            ? '<div style="text-align:center;margin-top:12px;padding:10px;color:#999;font-size:13px">评论正在出现…</div>'
            : pending.complete
            ? '<button id="chapter7ExposureReturn" style="width:100%;margin-top:12px;padding:11px;border:0;border-radius:20px;background:#e85d75;color:#fff">返回剧情页面</button>' + (pending.event.phase === "secondPost" && !pending.customPost ? '<button id="chapter7ExposureCustomPost" style="width:100%;margin-top:9px;padding:11px;border:1px solid #e85d75;border-radius:20px;background:#fff;color:#e85d75">发微博</button>' : '')
            : '<button id="chapter7ExposureComment" style="width:100%;margin-top:12px;padding:11px;border:1px solid #e85d75;border-radius:20px;background:#fff;color:#e85d75">点击评论区发送评论</button>';
        var customHtml = "";
        if (pending.customPost) {
            customHtml = '<div style="margin-top:18px;padding-top:14px;border-top:6px solid #f5f5f5"><div style="display:flex;gap:9px;align-items:center"><div style="width:38px;height:38px;border-radius:50%;overflow:hidden;background:#f0f0f0;display:flex;align-items:center;justify-content:center">' + chapter7ExposureAvatar() + '</div><div><b>' + chapter7EscapeHtml((player && (player.weiboName || player.name)) || "用户") + '</b><div style="font-size:11px;color:#aaa">刚刚</div></div></div><div style="font-size:14px;line-height:1.65;margin-top:10px;white-space:pre-wrap">' + chapter7EscapeHtml(pending.customPost.content) + '</div><div style="font-size:12px;color:#999;margin-top:10px">评论区</div>' + (pending.customPost.comments || []).map(function (text, index) { return '<div style="padding:7px 0;border-bottom:1px solid #f2f2f2;font-size:13px"><b>网友' + (index + 1) + '</b>：' + chapter7EscapeHtml(text) + '</div>'; }).join('') + (pending.customPost.loading ? '<div style="padding:12px;text-align:center;color:#999;font-size:12px">正在生成评论…</div>' : '') + '</div>';
        }
        panel.innerHTML = '<div style="display:flex;gap:9px;align-items:center"><div style="width:38px;height:38px;border-radius:50%;overflow:hidden;background:#f0f0f0;display:flex;align-items:center;justify-content:center">' + chapter7ExposureAvatar() + '</div><div><b>' + chapter7EscapeHtml((player && (player.weiboName || player.name)) || "用户") + '</b><div style="font-size:11px;color:#aaa">刚刚</div></div></div><div style="font-size:14px;line-height:1.65;margin-top:10px;white-space:pre-wrap">' + chapter7EscapeHtml(post.content) + '</div>' + media + '<div style="font-size:12px;color:#999;margin-top:10px">评论区</div><div>' + comments + '</div>' + actions + customHtml;
        container.prepend(panel);
        var commentButton = document.getElementById("chapter7ExposureComment");
        if (commentButton) commentButton.onclick = chapter7SendExposureComment;
        var returnButton = document.getElementById("chapter7ExposureReturn");
        if (returnButton) returnButton.onclick = chapter7FinishExposureStep;
        var customButton = document.getElementById("chapter7ExposureCustomPost");
        if (customButton) customButton.onclick = chapter7ShowCustomExposureComposer;
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
        panel.innerHTML = '<div style="display:flex;gap:9px;align-items:center"><img src="' + (typeof getZhangGuiyuanAvatar === "function" ? getZhangGuiyuanAvatar() : "zgyx.jpg") + '" style="width:40px;height:40px;border-radius:50%;object-fit:cover"><div><b>' + chapter7EscapeHtml(event.author || "张桂源") + '</b><div style="font-size:11px;color:#aaa">刚刚</div></div></div><div style="font-size:14px;line-height:1.65;margin-top:10px;white-space:pre-wrap">' + chapter7EscapeHtml(event.content || "") + '</div><div id="chapter7ApologyImage" style="position:relative;width:calc(100% + 28px);margin-left:-14px;aspect-ratio:1055/1491;background:#f1f1f1;margin-top:10px;display:flex;align-items:center;justify-content:center;color:#999;font-size:13px;cursor:zoom-in;overflow:hidden"><span>手写道歉信</span><img src="' + chapter7EscapeHtml(event.image || "") + '" style="position:absolute;inset:0;display:block;width:100%;height:100%;object-fit:cover;background:#f6f6f6" onerror="this.style.display=\'none\'"></div><div style="display:flex;justify-content:space-between;color:#999;font-size:12px;margin-top:10px"><span>转发 ' + chapter7EscapeHtml(event.reposts || "0") + '</span><span>评论 ' + chapter7EscapeHtml(event.commentCount || "0") + '</span><span>点赞 ' + chapter7EscapeHtml(event.likes || "0") + '</span></div><div style="margin-top:8px;padding-top:6px;border-top:1px solid #eee">' + comments + '</div><button id="chapter7ExposureReturn" style="width:100%;margin-top:12px;padding:11px;border:0;border-radius:20px;background:#e85d75;color:#fff">返回剧情页面</button>';
        container.prepend(panel);
        document.getElementById("chapter7ExposureReturn").onclick = chapter7FinishExposureStep;
        document.getElementById("chapter7ApologyImage").onclick = function () { chapter7ShowImageViewer(event.image || "dqx.png"); };
    }

    function chapter7ShowImageViewer(src) {
        var old = document.getElementById("chapter7ImageViewer");
        if (old) old.remove();
        var viewer = document.createElement("div");
        viewer.id = "chapter7ImageViewer";
        viewer.style.cssText = "position:fixed;inset:0;z-index:10040;background:rgba(0,0,0,.92);display:flex;align-items:center;justify-content:center;padding:12px;cursor:zoom-out";
        viewer.innerHTML = '<img src="' + chapter7EscapeHtml(src) + '" style="display:block;max-width:100%;max-height:100%;object-fit:contain">';
        viewer.onclick = function () { viewer.remove(); };
        document.body.appendChild(viewer);
    }

    function chapter7ShowEndingTransition(event) {
        var overlay = document.getElementById("chapter7StoryOverlay");
        if (!overlay) return;
        var transition = document.createElement("div");
        transition.className = "chapter7-ending-transition";
        transition.textContent = event.text || "Ending";
        overlay.appendChild(transition);
        requestAnimationFrame(function () { requestAnimationFrame(function () { transition.classList.add("show"); }); });
        setTimeout(function () {
            transition.style.opacity = "0";
            transition.style.transform = "translateY(-42px)";
        }, 1900);
        setTimeout(function () {
            transition.remove();
            chapter7AdvanceSequence();
        }, 2850);
    }

    function chapter7SendExposureComment() {
        var pending = window.chapter7PendingExposureWeibo;
        if (!pending) return;
        var items = pending.event.userComments || [];
        if (pending.commentIndex >= items.length) return;
        var item = items[pending.commentIndex];
        var entry = typeof item === "string" ? { text: item } : item;
        chapter7ShowExposureCommentModal(entry, function () {
            if (!window.chapter7ExposurePost) window.chapter7ExposurePost = { content: "", userComments: [], fixedComments: [], timeline: [], hasRecords: true };
            window.chapter7ExposurePost.userComments.push(entry);
            if (!window.chapter7ExposurePost.timeline) window.chapter7ExposurePost.timeline = [];
            window.chapter7ExposurePost.timeline.push({ kind: "user", entry: entry });
            pending.commentIndex += 1;
            if (pending.commentIndex >= items.length) chapter7RevealExposureComments(pending.event.fixedComments || [], pending);
            chapter7RenderExposurePanel();
        });
    }

    function chapter7RevealExposureComments(comments, pending) {
        var queue = (comments || []).slice();
        var revealNumber = 0;
        if (!queue.length) {
            pending.complete = true;
            chapter7RenderExposurePanel();
            return;
        }
        pending.revealing = true;
        pending.complete = false;
        function revealNext() {
            if (!window.chapter7PendingExposureWeibo || window.chapter7PendingExposureWeibo !== pending) return;
            if (!queue.length) {
                pending.revealing = false;
                pending.complete = true;
                chapter7RenderExposurePanel();
                return;
            }
            window.chapter7ExposurePost.fixedComments.push(queue.shift());
            revealNumber += 1;
            if (!window.chapter7ExposurePost.timeline) window.chapter7ExposurePost.timeline = [];
            window.chapter7ExposurePost.timeline.push({ kind: "fixed", text: window.chapter7ExposurePost.fixedComments[window.chapter7ExposurePost.fixedComments.length - 1] });
            chapter7RenderExposurePanel();
            chapter7ShowExposurePrivateMessage(pending.event.phase, revealNumber);
            setTimeout(revealNext, 720);
        }
        setTimeout(revealNext, 520);
    }

    function chapter7ShowExposurePrivateMessage(phase, number) {
        var first = ["造谣4000+", "你没马吗这么爱蹭", "公司都澄清了又造谣了？", "丑女能不能去死啊", "你今晚睡觉别闭眼", "小姐姐您貌似只是个素人吧？"];
        var later = ["求求你了能不能别发了", "您要毁了张桂源吗？", "你是真的喜欢他吗？", "回我一下姐姐", "能不能买照片", "我靠能不能开直播讲啊好刺激", "真的假的啊", "你有毛病吧？和豆包聊爽了？"];
        var list = phase === "firstPost" ? first : phase === "moreComments" ? later : [];
        var text = list[number - 1];
        if (!text) return;
        showMessageNotification("微博私信", '<span style="font-size:29px">💌</span>', "微博私信", text, function () { switchPage("weibo"); });
    }

    function chapter7ShowCustomExposureComposer() {
        var pending = window.chapter7PendingExposureWeibo;
        if (!pending || pending.customPost) return;
        var old = document.getElementById("chapter7CustomWeiboModal");
        if (old) old.remove();
        var modal = document.createElement("div");
        modal.id = "chapter7CustomWeiboModal";
        modal.style.cssText = "position:fixed;inset:0;z-index:10035;background:rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center;padding:22px";
        modal.innerHTML = '<div style="width:min(350px,92vw);background:#fff;border-radius:16px;padding:18px"><div style="font-size:17px;font-weight:700;margin-bottom:12px">发微博</div><textarea maxlength="500" placeholder="写下你想说的话…" style="box-sizing:border-box;width:100%;height:130px;padding:12px;border:1px solid #ddd;border-radius:10px;resize:none;font-size:14px"></textarea><div style="display:flex;gap:10px;margin-top:14px"><button data-role="cancel" style="flex:1;padding:10px;border:1px solid #ddd;border-radius:20px;background:#fff">取消</button><button data-role="send" style="flex:1;padding:10px;border:0;border-radius:20px;background:#e85d75;color:#fff">发送</button></div></div>';
        document.body.appendChild(modal);
        modal.querySelector('[data-role="cancel"]').onclick = function () { modal.remove(); };
        modal.querySelector('[data-role="send"]').onclick = function () {
            var content = modal.querySelector("textarea").value.trim();
            if (!content) { alert("请输入内容"); return; }
            modal.remove();
            pending.customPost = { content: content, comments: [], loading: true };
            chapter7RenderExposurePanel();
            chapter7GenerateCustomExposureReplies(content, function (replies) {
                if (!window.chapter7PendingExposureWeibo || window.chapter7PendingExposureWeibo !== pending || !pending.customPost) return;
                pending.customPost.loading = false;
                var queue = replies.slice(0, 10);
                function next() {
                    if (!queue.length || !window.chapter7PendingExposureWeibo || window.chapter7PendingExposureWeibo !== pending) return;
                    pending.customPost.comments.push(queue.shift());
                    chapter7RenderExposurePanel();
                    if (queue.length) setTimeout(next, 520);
                }
                next();
            });
        };
    }

    function chapter7GenerateCustomExposureReplies(content, callback) {
        var fallbackPool = ["所以现在是在承认恋爱吗", "普通同学会发这种话？", "能不能放过他啊", "姐姐你到底想说什么", "又开始蹭了是吧", "公司都回应了还在发", "我只想知道聊天记录真的假的", "不管怎样别网暴素人吧", "张桂源粉丝先冷静一下", "这瓜怎么还没结束", "她也是未成年吧嘴下留情", "到底是谁先对不起谁", "路人看得一脸懵", "能不能把事情一次说清楚", "评论区别骂得太难听了"];
        function fallback() { return fallbackPool.slice().sort(function () { return Math.random() - 0.5; }).slice(0, 10); }
        var baseUrl = (localStorage.getItem("api_base_url") || "").replace(/\/+$/, "");
        var apiKey = localStorage.getItem("api_key") || "";
        var model = localStorage.getItem("api_model") || "";
        var customModel = localStorage.getItem("api_custom_model") || "";
        if (!baseUrl || !apiKey) { callback(fallback()); return; }
        var endpoint = /\/chat\/completions$/i.test(baseUrl) ? baseUrl : baseUrl + "/chat/completions";
        var prompt = "背景：一名爱豆被曝光有女友，发帖者就是被曝光的女友，正处在激烈舆论中。她新发了一条微博：\n" + content + "\n请模拟粉丝、路人、质疑者等不同立场，生成恰好10条真实简短的微博评论。允许有情绪和质疑，但不要出现违法威胁、诅咒死亡或极端辱骂。只输出JSON字符串数组，不要解释。";
        fetch(endpoint, { method:"POST", headers:{"Content-Type":"application/json","Authorization":"Bearer " + apiKey}, body:JSON.stringify({ model:(model === "custom" ? customModel : model) || "deepseek-v4-flash", messages:[{role:"system",content:"你负责生成符合剧情语境的中文微博评论。"},{role:"user",content:prompt}], max_tokens:600, temperature:0.95 }) })
            .then(function (response) { if (!response.ok) throw new Error("API " + response.status); return response.json(); })
            .then(function (data) {
                var raw = data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content || "";
                raw = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
                var replies;
                try { replies = JSON.parse(raw); } catch (error) { replies = raw.split(/\n+/).map(function (line) { return line.replace(/^\s*(?:[-*•]|\d+[.、])\s*/, "").trim(); }).filter(Boolean); }
                replies = Array.isArray(replies) ? replies.map(String).filter(Boolean).slice(0, 10) : [];
                if (replies.length < 10) replies = replies.concat(fallback().slice(0, 10 - replies.length));
                callback(replies);
            }).catch(function () { callback(fallback()); });
    }

    function chapter7ShowExposureCommentModal(entry, callback) {
        var old = document.getElementById("chapter7ExposureCommentModal");
        if (old) old.remove();
        var modal = document.createElement("div");
        modal.id = "chapter7ExposureCommentModal";
        modal.style.cssText = "position:fixed;inset:0;z-index:10030;background:rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center;padding:22px";
        modal.innerHTML = '<div style="width:min(340px,92vw);background:#fff;border-radius:16px;padding:18px;box-shadow:0 16px 48px rgba(0,0,0,.3)"><div style="font-weight:700;font-size:16px;margin-bottom:12px">发送评论</div><div style="padding:12px;border:1px solid #eee;border-radius:10px;font-size:14px;line-height:1.6;word-break:break-word">' + chapter7EscapeHtml(entry.text) + (entry.image ? '<div style="margin-top:9px;color:#999;font-size:12px">附带照片</div>' : '') + '</div><div style="display:flex;gap:10px;margin-top:16px"><button type="button" data-role="cancel" style="flex:1;padding:10px;border:1px solid #ddd;border-radius:20px;background:#fff;color:#666">取消</button><button type="button" data-role="send" style="flex:1;padding:10px;border:0;border-radius:20px;background:#e85d75;color:#fff">发送</button></div></div>';
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

    function chapter7ShowStoryFriendRequest(event, startChatAfterAccept) {
        var contact = event.contact || event.displayName || "新朋友";
        var displayName = event.displayName || contact;
        var request = { name: displayName, intro: event.intro || "申请添加你为好友", avatar: event.avatar || "" };
        if (typeof friendRequests !== "undefined" && Array.isArray(friendRequests) && !friendRequests.some(function (item) { return item.name === displayName; })) {
            friendRequests.push(request);
        }
        if (typeof hasNewFriendRequest !== "undefined") hasNewFriendRequest = true;
        var redDot = document.getElementById("friendRedDot");
        if (redDot) redDot.style.display = "block";
        showMessageNotification("好友申请", event.avatar ? '<img src="' + event.avatar + '" style="width:42px;height:42px;border-radius:9px;object-fit:cover">' : '<span style="font-size:30px">👤</span>', displayName, event.intro || "申请添加你为好友", function () {});

        var old = document.getElementById("chapter7FriendRequestModal");
        if (old) old.remove();
        var modal = document.createElement("div");
        modal.id = "chapter7FriendRequestModal";
        modal.style.cssText = "position:fixed;inset:0;z-index:10030;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.48);padding:24px";
        modal.innerHTML = '<div style="width:min(340px,90vw);background:#fff;border-radius:16px;padding:22px;color:#222;box-shadow:0 18px 55px rgba(0,0,0,.35)">' +
            '<div style="font-size:18px;font-weight:700;margin-bottom:18px">好友申请</div>' +
            '<div style="display:flex;align-items:center;gap:13px;margin-bottom:22px"><img src="' + (event.avatar || "default_avatar.png") + '" style="width:52px;height:52px;border-radius:12px;object-fit:cover"><div><b style="font-size:16px">' + displayName + '</b><div style="margin-top:5px;color:#888;font-size:13px">' + (event.intro || "申请添加你为好友") + '</div></div></div>' +
            '<button id="chapter7AcceptFriend" style="width:100%;height:44px;border:0;border-radius:22px;background:#e85d75;color:#fff;font-size:15px;font-weight:600">接受</button></div>';
        document.body.appendChild(modal);
        modal.querySelector("#chapter7AcceptFriend").onclick = function () {
            if (typeof friends !== "undefined" && Array.isArray(friends) && friends.indexOf(contact) === -1) friends.push(contact);
            if (typeof friendRequests !== "undefined" && Array.isArray(friendRequests)) friendRequests = friendRequests.filter(function (item) { return item.name !== displayName; });
            if (typeof hasNewFriendRequest !== "undefined") hasNewFriendRequest = typeof friendRequests !== "undefined" && friendRequests.length > 0;
            if (redDot) redDot.style.display = (typeof hasNewFriendRequest !== "undefined" && hasNewFriendRequest) ? "block" : "none";
            if (!chatData[contact]) chatData[contact] = { messages: [], newMsg: false };
            if (typeof renderChatList === "function") renderChatList();
            modal.remove();
            if (startChatAfterAccept) {
                var entries = event.entries || [];
                var notices = entries.slice(0, event.preloadCount || 2).map(function (entry) { return { text: entry.text || "" }; });
                chapter7StartScriptedChat(contact, entries, event.bg, notices, false, event.preloadCount || 2, null);
            } else {
                showMessageNotification("好友申请", event.avatar ? '<img src="' + event.avatar + '" style="width:42px;height:42px;border-radius:9px;object-fit:cover">' : '<span style="font-size:30px">👤</span>', displayName, "已添加到聊天列表，请返回剧情", function () {});
                chapter7AdvanceSequence();
            }
            if (typeof autoSaveGame === "function") autoSaveGame();
        };
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
        if (contact === "everybody 棒棒") {
            data.messages = (data.messages || []).filter(function (message) { return !message.chapter7; });
        }
        data.chapter7ChatActive = true;
        data.newMsg = true;
        var chatDate = contact === "everybody 棒棒" ? "2025年6月3日" : "2025年5月31日";
        (incoming || []).forEach(function (message, index) {
            if (message.withdrawn) {
                chapter7PushMessage(contact, { from: "system", text: message.text, time: chapter7MessageTime(index), date: chatDate, read: false, chapter7: true, isSystem: true });
            } else {
                chapter7PushMessage(contact, { from: message.from, groupSender: message.from, text: replaceChapter7Tokens(message.text).replace(/。$/u, ""), avatar: chapter4GroupAvatarPath(message.from), time: chapter7MessageTime(index), date: chatDate, read: false, chapter7: true });
            }
        });
        window.chapter7PendingChat = { contact: contact, messages: messages.map(function (text) { return replaceChapter7Tokens(text).replace(/。$/u, ""); }), index: 0, date: chatDate };
        renderChatList();
        var hintText = contact === "everybody 棒棒" ? "请点击群聊" : "请点击聊天页面";
        chapter7ShowPage({ type: "page", text: hintText, speaker: "提示", side: "left", bg: background || (window.chapter7CurrentPage && window.chapter7CurrentPage.bg) || "mk.jpg" });
        document.getElementById("chapter7Continue").textContent = contact === "everybody 棒棒" ? "请点击群聊" : "请点击下方微信进入聊天页面";
    }

    function chapter7StartScriptedChat(contact, entries, background, notifications, preloadFirstIncoming, preloadCount, choice) {
        if (!chatData[contact]) chatData[contact] = { messages: [], newMsg: false };
        chatData[contact].chapter7ChatActive = true;
        chatData[contact].newMsg = true;
        var normalized = entries.map(function (entry) { return Object.assign({}, entry, { text: replaceChapter7Tokens(entry.text || "") }); });
        var startIndex = 0;
        var requestedPreload = Math.max(preloadFirstIncoming ? 1 : 0, Number(preloadCount) || 0);
        while (startIndex < requestedPreload && normalized[startIndex] && normalized[startIndex].from !== "me") {
            var first = normalized[startIndex];
            var firstContent = first.image ? '<img src="' + first.image + '" style="width:170px;max-width:100%;border-radius:10px;display:block" onerror="this.outerHTML=\'[图片]\'">' : first.text;
            chapter7PushMessage(contact, { from: "other", text: firstContent, time: chapter7MessageTime(startIndex + 3), date: "", read: false, chapter7: true });
            startIndex += 1;
        }
        window.chapter7PendingChat = { contact: contact, entries: normalized, index: startIndex, scripted: true, choice: choice || null, nextRoute: null };
        renderChatList();
        chapter7ShowPage({ type: "page", text: "请点击聊天列表", speaker: "提示", side: "left", bg: background || (window.chapter7CurrentPage && window.chapter7CurrentPage.bg) || "__white__" });
        document.getElementById("chapter7Continue").textContent = "请点击下方微信进入聊天列表";
        (notifications || []).slice(0, 2).forEach(function (notice, index) {
            setTimeout(function () {
                var noticeText = notice.image ? "[图片]" : replaceChapter7Tokens(notice.text || "");
                var avatar = typeof getContactAvatar === "function" ? getContactAvatar(contact) : "";
                var icon = avatar ? '<img src="' + avatar + '" style="width:42px;height:42px;border-radius:8px;object-fit:cover">' : '<span style="font-size:30px">💬</span>';
                showMessageNotification(contact, icon, contact, noticeText, function () { switchPage("chat"); setTimeout(function () { openChapter7Chat(contact); }, 80); });
            }, 250 + index * 950);
        });
    }

    function chapter7FinishScriptedChat(pending) {
        if (pending.choice) {
            chapter7ShowChoiceInChat(pending);
            return;
        }
        var data = chatData[pending.contact];
        if (data) data.chapter7ChatActive = false;
        window.chapter7PendingChat = null;
        var input = document.getElementById("chatInputBox");
        if (input) input.innerText = "发送完成，请返回剧情页面";
        if (pending.nextRoute) chapter7SetRoute(pending.nextRoute, false);
        showMessageNotification("第七章剧情", '<span style="font-size:30px">📖</span>', "第七章剧情", "聊天完成，请返回剧情页面继续", function () { switchPage("story"); });
        if (typeof autoSaveGame === "function") autoSaveGame();
    }

    function chapter7ShowChoiceInChat(pending) {
        var box = document.getElementById("chatMessages");
        if (!box || document.getElementById("chapter7ChatChoice")) return;
        var choice = pending.choice;
        var wrap = document.createElement("div");
        wrap.id = "chapter7ChatChoice";
        wrap.style.cssText = "align-self:center;width:88%;margin:14px auto;padding:12px;border-radius:12px;background:rgba(255,255,255,.92);box-shadow:0 3px 14px rgba(0,0,0,.12)";
        var title = document.createElement("div");
        title.textContent = "请选择回复";
        title.style.cssText = "font-size:12px;color:#888;text-align:center;margin-bottom:9px";
        wrap.appendChild(title);
        (choice.options || []).forEach(function (option, index) {
            var button = document.createElement("button");
            button.textContent = option.title;
            button.style.cssText = "display:block;width:100%;height:40px;margin-top:8px;border:1px solid #e85d75;border-radius:20px;background:#fff;color:#d94f68;font-size:14px";
            button.onclick = function () {
                localStorage.setItem("chapter7_choice_" + (choice.id || "chat"), String(index));
                wrap.remove();
                pending.choice = null;
                pending.entries = (option.entries || []).map(function (entry) { return Object.assign({}, entry, { text: replaceChapter7Tokens(entry.text || "") }); });
                pending.index = 0;
                pending.nextRoute = option.route || null;
                chapter7ShowNextScriptedEntry();
            };
            wrap.appendChild(button);
        });
        box.appendChild(wrap);
        box.scrollTop = box.scrollHeight;
        var input = document.getElementById("chatInputBox");
        if (input) input.innerText = "请直接在聊天页面选择回复";
    }

    function chapter7ShowNextScriptedEntry() {
        var pending = window.chapter7PendingChat;
        if (!pending || !pending.scripted || document.querySelector(".option-modal")) return;
        if (pending.index >= pending.entries.length) {
            chapter7FinishScriptedChat(pending);
            return;
        }
        var entry = pending.entries[pending.index];
        if (entry.from === "me") {
            var replyOptions = entry.choices && entry.choices.length ? entry.choices : [entry.image ? "发送图片" : entry.text];
            showOptionsModal(replyOptions, entry.choices ? "选择回复" : "选择发送", function (choiceIndex) {
                var selectedText = entry.choices ? entry.choices[choiceIndex] : entry.text;
                var content = entry.image ? '<img src="' + entry.image + '" style="width:170px;max-width:100%;border-radius:10px;display:block" onerror="this.outerHTML=\'[图片]\'">' : selectedText;
                chapter7PushMessage(pending.contact, { from: "me", text: content, time: chapter7MessageTime(pending.index + 3), date: "", read: true, chapter7: true });
                pending.index += 1;
                setTimeout(chapter7ShowNextScriptedEntry, 420);
            });
            return;
        }
        var wait = Math.min(1800, 650 + String(entry.text || "").length * 45);
        var input = document.getElementById("chatInputBox");
        if (input) input.innerText = "对方正在输入中...";
        setTimeout(function () {
            if (!window.chapter7PendingChat || window.chapter7PendingChat !== pending) return;
            var content = entry.image ? '<img src="' + entry.image + '" style="width:170px;max-width:100%;border-radius:10px;display:block" onerror="this.outerHTML=\'[图片]\'">' : entry.text;
            chapter7PushMessage(pending.contact, { from: "other", text: content, time: chapter7MessageTime(pending.index + 3), date: "", read: false, chapter7: true });
            pending.index += 1;
            setTimeout(chapter7ShowNextScriptedEntry, 360);
        }, wait);
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
        if (window.chapter7PendingRequiredAction && window.chapter7PendingRequiredAction.contact === contact && !window.chapter7PendingRequiredAction.confirmed) chapter7BindRequiredActionControls(window.chapter7PendingRequiredAction);
        if (window.chapter7PendingChat && window.chapter7PendingChat.contact === contact) setTimeout(window.chapter7PendingChat.scripted ? chapter7ShowNextScriptedEntry : chapter7ShowNextOutgoingOption, 350);
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
            chapter7PushMessage(pending.contact, { from: "me", text: text.replace(/。$/u, ""), time: chapter7MessageTime(pending.index + 3), date: pending.date || "2025年5月31日", read: true, chapter7: true });
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
                if (event.id === "main_path") chapter7StopDreamAudio();
                wrap.remove();
                chapter7SetRoute(option.route, false);
                if (typeof autoSaveGame === "function") autoSaveGame();
                chapter7AdvanceSequence();
            };
            wrap.appendChild(button);
        });
        overlay.appendChild(wrap);
    }

    function chapter7ShowExploreChoice(event) {
        if (!event) return;
        window.chapter7ExploreChoiceEvent = event;
        var overlay = document.getElementById("chapter7StoryOverlay");
        if (!overlay) return;
        var old = overlay.querySelector(".chapter7-story-options");
        if (old) old.remove();
        var remaining = (event.options || []).filter(function (option) { return !window.chapter7VisitedPlaces[option.key]; });
        if (!remaining.length) {
            if (chapter7SetRoute(event.commonRoute, false)) chapter7AdvanceSequence();
            return;
        }
        document.getElementById("chapter7Continue").textContent = remaining.length === 1 ? "还需前往剩余地点" : "两个地点都需要寻找";
        var wrap = document.createElement("div");
        wrap.className = "chapter7-story-options";
        remaining.forEach(function (option, index) {
            var button = document.createElement("button");
            button.className = "chapter7-story-option";
            button.innerHTML = "<strong>" + (index + 1) + ". " + replaceChapter7Tokens(option.title) + "</strong>";
            button.onclick = function (clickEvent) {
                clickEvent.stopPropagation();
                window.chapter7VisitedPlaces[option.key] = true;
                wrap.remove();
                chapter7SetRoute(option.route, false);
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
        [{ label: event.yesLabel || "是，查看上帝视角", route: event.yesRoute, perspective: event.yesPerspective !== false }, { label: event.noLabel || "否，继续后续剧情", route: event.noRoute, perspective: false }].forEach(function (item) {
            var button = document.createElement("button");
            button.className = "chapter7-story-option";
            button.innerHTML = "<strong>" + item.label + "</strong>";
            button.onclick = function (clickEvent) {
                clickEvent.stopPropagation();
                wrap.remove();
                if (item.route === "__home__") {
                    chapter7ExitToHome();
                    return;
                }
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
        chapter7BindRequiredActionControls(action);
        var input = document.getElementById("chatInputBox");
        if (input) input.innerText = actionType === "delete" ? "请点击右上角删除好友" : "请点击右上角退出群聊";
    }

    function chapter7BindRequiredActionControls(action) {
        if (!action || action.confirmed) return;
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
            var message = action.actionType === "delete" ? "请先删除张桂源继续剧情！" : "请先退出群聊继续剧情！";
            showMessageNotification("第七章剧情", '<span style="font-size:28px">📖</span>', "提示", message, function () {});
        };
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
        window.chapter7EndingReached = true;
        if (typeof autoSaveGame === "function") autoSaveGame();
        setTimeout(function () {
            ending.onclick = function () {
                ending.style.opacity = "0";
                setTimeout(function () {
                    ending.remove();
                    window.closeChapter7Story();
                }, 800);
            };
        }, 900);
    }

    function chapter7ShowEndingContinue(event) {
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
                setTimeout(function () {
                    ending.remove();
                    chapter7AdvanceSequence();
                }, 800);
            };
        }, 900);
    }

    function chapter7ExitToHome() {
        chapter7StopDreamAudio();
        chapter7FadeRouteBgm(700);
        var overlay = document.getElementById("chapter7StoryOverlay");
        if (overlay) overlay.remove();
        window.chapter7SessionActive = false;
        window.chapter7EndingReached = false;
        window.chapter7PerspectiveMode = false;
        window.chapter7RouteId = "intro";
        window.chapter7SequenceIndex = 0;
        window.chapter7Sequence = window.chapter7Routes && window.chapter7Routes.intro;
        window.chapter7CurrentPage = null;
        document.getElementById("storyDetailPage").style.display = "none";
        document.getElementById("chapterSelectPage").style.display = "block";
        renderChapterList();
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
        if (window.chapter7EndingReached) {
            var overlay = document.getElementById("chapter7StoryOverlay");
            if (overlay) overlay.remove();
            window.chapter7SessionActive = false;
            window.chapter7EndingReached = false;
            window.chapter7RouteId = "intro";
            window.chapter7SequenceIndex = 0;
            window.chapter7Sequence = window.chapter7Routes && window.chapter7Routes.intro;
            window.chapter7CurrentPage = null;
        }
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
            timeline: [],
            hasRecords: pending.event.phase === "firstPost"
        };
        pending.published = true;
        pending.commentIndex = 0;
        if (pending.event.phase === "secondPost") {
            chapter7RevealExposureComments(pending.event.fixedComments || [], pending);
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
