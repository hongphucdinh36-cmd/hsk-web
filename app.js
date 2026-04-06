import { HSK_DATA } from "./index.js";

console.log("HSK_DATA:", HSK_DATA);

const DATA = normalizeData(HSK_DATA);
console.log(DATA);
// ===== NORMALIZE DATA (🔥 QUAN TRỌNG) =====
function normalizeData(data) {
    const newData = {}; // 🔥 THIẾU DÒNG NÀY

    Object.keys(data).forEach(level => {
        const lvl = Number(level);

        newData[lvl] = [];

        data[level].forEach(word => {
            const hanziList = word.hanzi.split("｜");
            const pinyinList = word.pinyin.split("｜");

            hanziList.forEach((hz, index) => {
                newData[lvl].push({
                    hanzi: hz.trim(),
                    pinyin: pinyinList[index] ? pinyinList[index].trim() : word.pinyin,
                    meaning: word.meaning
                });
            });
        });
    });

    return newData;
}


// ===== LEVEL =====
const levels = [
    { level: 1, vocab: 500, desc: "Cơ bản - Giao tiếp đơn giản" },
    { level: 2, vocab: 1272, desc: "Sơ cấp - Trao đổi hàng ngày" },
    { level: 3, vocab: 2245, desc: "Trung cấp - Giao tiếp thường ngày" },
    { level: 4, vocab: 3245, desc: "Trung cao - Thảo luận đa dạng" }
];

let currentLevel = 1;
let isShuffled = false;
let quizWords = [];
let currentQuestion = 0;
let correctAnswers = [];
let selectedToSave = [];

let knownWords = new Set(JSON.parse(localStorage.getItem("knownWords")) || []);
knownWords = new Set([...knownWords].map(w => w.trim()));

let currentMode = "all";
let visibleCount = 50;
let currentWords = [];
let testMode = "meaning"; // meaning | hanzi | both

// ===== DOM =====
const container = document.getElementById("levelContainer");
const homeScreen = document.getElementById("homeScreen");
const learnScreen = document.getElementById("learnScreen");
const testScreen = document.getElementById("testScreen");
const quizScreen = document.getElementById("quizScreen");
const resultScreen = document.getElementById("resultScreen");
const table = document.getElementById("vocabTable");
const title = document.getElementById("titleHSK");

// ===== RENDER LEVEL =====
levels.forEach(item => {
    const card = document.createElement("div");
    card.className = "card";

    card.innerHTML = `
        <div class="level-number">${item.level}</div>
        <div class="level-title">HSK ${item.level}</div>
        <div class="vocab">${item.vocab} từ vựng</div>
        <div class="desc">${item.desc}</div>
        <button class="btn">Bắt đầu học →</button>
    `;

    card.querySelector("button").onclick = () => startLearning(item.level);
    container.appendChild(card);
});

// ===== START =====
function startLearning(level) {
    currentLevel = level;
    isShuffled = false;
    currentMode = "all";

    homeScreen.style.display = "none";
    learnScreen.style.display = "block";


    title.innerText = "HSK " + level;
    renderTable(level);

    setModeActive("btnAll");
    document.getElementById("btnShuffle").classList.remove("active");
}

// ===== BACK =====
function goBack() {
    learnScreen.style.display = "none";
    homeScreen.style.display = "block";
    
}

// ===== TABLE =====
function renderTable(level) {
    updateHeader();

    let words = DATA[level] ? [...DATA[level]] : [];

    if (isShuffled) {
        words = shuffleArray([...words]); // clone tránh lỗi
    }

    currentWords = words;
    visibleCount = words.length; // 🔥 hiện toàn bộ luôn nếu muốn

    renderChunk();
}

function renderChunk() {
    const fragment = document.createDocumentFragment();
    const end = Math.min(visibleCount, currentWords.length);

    for (let i = 0; i < end; i++) {
        const word = currentWords[i];
        const isKnown = knownWords.has(word.hanzi);

        const tr = document.createElement("tr");

        let rowHTML = `<td>${i + 1}</td>`;

        // ===== MODE ALL =====
        if (currentMode === "all") {
            rowHTML += `
                <td>${word.hanzi}</td>
                <td>
                    <span class="speaker" onclick="speak('${word.hanzi}')">🔊</span>
                    ${word.pinyin}
                </td>
                <td>${word.meaning}</td>
                <td>${isKnown ? "⭐" : ""}</td>
            `;
        }
        
        // ===== MODE MEANING (nhập nghĩa tiếng Việt) =====
        else if (currentMode === "meaning") {
            rowHTML += `
                <td>${word.hanzi}</td>
                <td>
                    <span class="speaker" onclick="speak('${word.hanzi}')">🔊</span>
                    ${word.pinyin}
                </td>
                <td>
                    <input 
                        type="text" 
                        class="input-hanzi" 
                        placeholder="Nhập nghĩa..." 
                        data-answer="${word.meaning}"
                        onkeydown="handleCheck(event, this)"
                    >
                </td>
            `;
        }

        // ===== MODE MEANING (nhập chữ Hán) =====
        
        else if (currentMode === "hanzi") {
            rowHTML += `
                <td>
                    <input 
                        type="text" 
                        class="input-hanzi" 
                        placeholder="Nhập chữ Hán..." 
                        data-answer="${word.hanzi}"
                        onkeydown="handleCheck(event, this)"
                        autocomplete="off"
                    >
                </td>
                <td>
                    <span class="speaker" onclick="speak('${word.hanzi}')">🔊</span>
                    ${word.pinyin}
                </td>
                <td>${word.meaning}</td>
            `;
        }

        tr.innerHTML = rowHTML;
        fragment.appendChild(tr);
    }

    table.innerHTML = "";
    table.appendChild(fragment);
}

function updateHeader() {
    const thead = document.querySelector("thead");

    if (currentMode === "all") {
        thead.innerHTML = `
            <tr>
                <th>#</th>
                <th>Chữ Hán</th>
                <th>Phiên âm</th>
                <th>Nghĩa</th>
                <th>Đã nhớ</th>
            </tr>
        `;
    } 
    else if (currentMode === "meaning") {
        thead.innerHTML = `
            <tr>
                <th>#</th>
                <th>Chữ Hán</th>
                <th>Phiên âm</th>
                <th>Nhập nghĩa tiếng Việt</th>
            </tr>
        `;
    } 
    else if (currentMode === "hanzi") {
        thead.innerHTML = `
            <tr>
                <th>#</th>
                <th>Nhập chữ Hán</th>
                <th>Phiên âm</th>
                <th>Nghĩa</th>
            </tr>
        `;
    }
}

// ===== SEARCH =====
document.getElementById("searchInput").addEventListener("input", function () {
    const keyword = this.value.toLowerCase();

    currentWords = DATA[currentLevel].filter(w =>
        w.hanzi.includes(keyword) ||
        w.pinyin.toLowerCase().includes(keyword) ||
        w.meaning.toLowerCase().includes(keyword)
    );

    renderChunk();
});

// ===== SHUFFLE =====
function shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}


// ===== TEST BUTTON =====
document.getElementById("btnTest").onclick = () => {
    learnScreen.style.display = "none";
    testScreen.style.display = "block";

    updateTestUI();
};

// ===== UPDATE TEST UI =====
function updateTestUI() {
    const words = DATA[currentLevel] || [];

    const total = words.length;
    const known = words.filter(w => knownWords.has(w.hanzi)).length;

    document.querySelectorAll(".row")[0].children[0].innerText = `Tất cả (${total})`;
    document.querySelectorAll(".row")[0].children[1].innerText = `Đã nhớ ⭐ (${known})`;

    updateProgress();
}

// ===== START TEST =====
function startTest() {
    const modeText = document.querySelector(".row:nth-of-type(2) .active").innerText;

    if (modeText.includes("nghĩa")) testMode = "meaning";
    else if (modeText.includes("Hán")) testMode = "hanzi";
    else testMode = "both";

    resultScreen.style.display = "none";
    const old = document.getElementById("resultList");
    if (old) old.remove();
    document.getElementById("skipKnown").checked = false; // 👈 thêm dòng này
    const num = getSelectedNumber();
    const skip = document.getElementById("skipKnown");

    const activeType = document.querySelector(".row:nth-of-type(1) .active").innerText;

    let words = DATA[currentLevel] ? [...DATA[currentLevel]] : [];

    if (activeType.includes("Đã nhớ")) {
        words = words.filter(w => knownWords.has(w.hanzi));
        skip.checked = false;
        skip.disabled = true;
    } else {
        skip.disabled = false;
    }

    if (skip.checked) {
        words = words.filter(w => !knownWords.has(w.hanzi));
    }

    if (words.length === 0) {
        alert("Không còn từ để kiểm tra!");
        return;
    }

    words = shuffleArray(words);
    quizWords = words.slice(0, num);

    currentQuestion = 0;
    correctAnswers = [];

    testScreen.style.display = "none";
    quizScreen.style.display = "block";

    showQuestion();
}

// ===== QUIZ =====
function showQuestion() {
    let currentQuestionType = ""; // meaning | hanzi
    const word = quizWords[currentQuestion];

    document.getElementById("quizProgress").innerText =
        `Câu ${currentQuestion + 1} / ${quizWords.length}`;

    const hanziEl = document.getElementById("quizHanzi");
    const pinyinEl = document.getElementById("quizPinyin");

    let answers = [];
    let correctAnswer = "";

    // 🔥 FIX QUAN TRỌNG
    const pool = DATA[currentLevel] || [];

    if (pool.length === 0) {
        alert("Không có dữ liệu!");
        return;
    }

    // ===== TEST NGHĨA =====
    if (testMode === "meaning") {
        hanziEl.innerText = word.hanzi;
        pinyinEl.innerText = word.pinyin;

        correctAnswer = word.meaning;
        answers = [correctAnswer];

        while (answers.length < 4) {
            const random = pool[Math.floor(Math.random() * pool.length)].meaning;
            if (!answers.includes(random)) answers.push(random);
        }
    }

    // ===== TEST CHỮ HÁN =====
    else if (testMode === "hanzi") {
        hanziEl.innerText = word.meaning;
        pinyinEl.innerText = word.pinyin;

        correctAnswer = word.hanzi;
        answers = [correctAnswer];

        while (answers.length < 4) {
            const random = pool[Math.floor(Math.random() * pool.length)].hanzi;
            if (!answers.includes(random)) answers.push(random);
        }
    }

    // ===== CẢ 2 =====
    else if (testMode === "both") {
        const isMeaning = Math.random() > 0.5;

        if (isMeaning) {
            currentQuestionType = "meaning";

            hanziEl.innerText = word.hanzi;
            pinyinEl.innerText = word.pinyin;

            correctAnswer = word.meaning;
            answers = [correctAnswer];

            while (answers.length < 4) {
                const random = pool[Math.floor(Math.random() * pool.length)].meaning;
                if (!answers.includes(random)) answers.push(random);
            }
        } else {
            currentQuestionType = "hanzi";

            hanziEl.innerText = word.meaning;
            pinyinEl.innerText = word.pinyin;

            correctAnswer = word.hanzi;
            answers = [correctAnswer];

            while (answers.length < 4) {
                const random = pool[Math.floor(Math.random() * pool.length)].hanzi;
                if (!answers.includes(random)) answers.push(random);
            }
        }
    }

    answers = shuffleArray(answers);

    const box = document.getElementById("answers");
    box.innerHTML = "";

    answers.forEach(ans => {
        const btn = document.createElement("button");
        btn.className = "answer-btn";
        btn.innerText = ans;

        btn.onclick = () => checkAnswer(btn, ans === correctAnswer);
        box.appendChild(btn);
    });

    document.getElementById("quizSpeaker").onclick = () => {
        speak(word.hanzi);
    };
}

// ===== CHECK =====
function checkAnswer(btn, correct) {
    document.querySelectorAll(".answer-btn").forEach(b => b.disabled = true);

    if (correct) {
        btn.classList.add("correct");
        correctAnswers.push(quizWords[currentQuestion]);
    } else {
        btn.classList.add("wrong");
    }

    setTimeout(() => {
        currentQuestion++;
        if (currentQuestion < quizWords.length) showQuestion();
        else showResult();
    }, 600);
}

// ===== RESULT =====
function showResult() {
    quizScreen.style.display = "none";
    resultScreen.style.display = "block";

    const correct = correctAnswers.length;
    const total = quizWords.length;
    const wrong = total - correct;

    document.getElementById("resultScore").innerText = `${correct}/${total}`;
    document.getElementById("correctCount").innerText = correct;
    document.getElementById("wrongCount").innerText = wrong;

    selectedToSave = [...correctAnswers];
    renderResultList();
}
// ===== SAVE =====
function saveKnown() {
    selectedToSave.forEach(w => knownWords.add(w.hanzi));
    localStorage.setItem("knownWords", JSON.stringify([...knownWords]));
    alert("Đã lưu ⭐");
    updateProgress();
    renderTable(currentLevel);
}

// ===== RESULT LIST =====
function renderResultList() {
    const old = document.getElementById("resultList");
    if (old) old.remove();

    const container = document.querySelector("#resultScreen .quiz-card");

    const listDiv = document.createElement("div");
    listDiv.id = "resultList";
    listDiv.style.marginTop = "20px";
    listDiv.style.maxHeight = "250px";
    listDiv.style.overflowY = "auto";
    listDiv.style.borderTop = "1px solid #eee";

    // ===== HEADER =====
    const header = document.createElement("div");
    header.style.display = "grid";
    header.style.gridTemplateColumns = "40px 1fr 120px 80px";
    header.style.fontWeight = "bold";
    header.style.padding = "10px 5px";
    header.style.borderBottom = "2px solid #ddd";

    header.innerHTML = `
        <div>#</div>
        <div>Từ</div>
        <div>Nghĩa</div>
        <div>Chọn</div>
    `;

    listDiv.appendChild(header);

    // ===== DATA =====
    correctAnswers.forEach((word, index) => {
        const isChecked = selectedToSave.some(w => w.hanzi === word.hanzi);

        const row = document.createElement("div");

        row.style.display = "grid";
        row.style.gridTemplateColumns = "40px 1fr 120px 80px";
        row.style.alignItems = "center";
        row.style.padding = "10px 5px";
        row.style.borderBottom = "1px solid #eee";

        row.innerHTML = `
            <div>${index + 1}</div>

            <div>
                <b>${word.hanzi}</b>
                <span style="color:#777;">(${word.pinyin})</span>
            </div>

            <div style="color:#555;">${word.meaning}</div>

            <div style="text-align:center;">
                <input type="checkbox" ${isChecked ? "checked" : ""}>
            </div>
        `;

        const checkbox = row.querySelector("input");

        checkbox.onchange = () => {
            const i = selectedToSave.findIndex(w => w.hanzi === word.hanzi);

            if (checkbox.checked) {
                if (i === -1) selectedToSave.push(word);
            } else {
                if (i > -1) selectedToSave.splice(i, 1);
            }
        };

        listDiv.appendChild(row);
    });

    container.appendChild(listDiv);
}

// ===== NUMBER =====
function getSelectedNumber() {
    const input = document.getElementById("numWords").value;
    if (input) return Number(input);

    const active = document.querySelector(".row:nth-of-type(3) .active");
    if (!active) return 10;

    if (active.innerText.includes("50")) return 50;
    if (active.innerText.includes("Tất cả")) return DATA[currentLevel].length;

    return 10;
}

// ===== ACTIVE BUTTON FIX =====
document.querySelectorAll(".row").forEach(row => {
    const buttons = row.querySelectorAll(".test-btn");

    buttons.forEach(btn => {
        btn.addEventListener("click", () => {
            buttons.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
        });
    });
});

// ===== SPEAK =====
function speak(text) {
    const audio = new Audio(`/tts?text=${encodeURIComponent(text)}`);
    audio.play();
}
window.speak = speak;

// 🔥 QUAN TRỌNG
window.speak = speak;


function exitQuiz() {
    quizScreen.style.display = "none";
    learnScreen.style.display = "block";
}

document.getElementById("btnAll").onclick = () => {
    currentMode = "all";
    setModeActive("btnAll");
    renderTable(currentLevel);
};

document.getElementById("btnHanzi").onclick = () => {
    currentMode = "hanzi";
    setModeActive("btnHanzi");
    renderTable(currentLevel);
};

document.getElementById("btnMeaning").onclick = () => {
    currentMode = "meaning";
    setModeActive("btnMeaning");
    renderTable(currentLevel);
};

document.getElementById("btnShuffle").onclick = function () {
    isShuffled = !isShuffled;

    // 🔥 toggle độc lập
    this.classList.toggle("active");

    renderTable(currentLevel);
};

function setModeActive(id) {
    const modeBtns = ["btnAll", "btnHanzi", "btnMeaning"];

    modeBtns.forEach(btnId => {
        document.getElementById(btnId).classList.remove("active");
    });

    document.getElementById(id).classList.add("active");
}

function handleCheck(e, input) {
    if (e.key === "Enter") {
        e.preventDefault();

        const user = input.value.trim().toLowerCase();
        const correctRaw = input.dataset.answer.toLowerCase();
        const correctList = correctRaw.split(/[\/,;]/).map(s => s.trim());

        let isCorrect = false;

        if (currentMode === "meaning") {
            isCorrect = correctList.some(ans =>
                ans === user ||
                ans.includes(user) ||
                user.includes(ans)
            );
        } 
        else if (currentMode === "hanzi") {
            isCorrect = correctList.includes(user);
        }

        // reset class
        input.classList.remove("correct-input", "wrong-input");

        // apply class
        if (isCorrect) {
            input.classList.add("correct-input");
        } else {
            input.classList.add("wrong-input");
        }
    }
}

function updateProgress() {
    const words = DATA[currentLevel] || [];

    const total = words.length;
    const known = words.filter(w => knownWords.has(w.hanzi)).length;
    const remain = total - known;

    // Text chính
    document.getElementById("progressText").innerText =
        `${known} / ${total} từ đã nhớ ⭐`;

    // Text phụ
    document.getElementById("progressSub").innerText =
        `Còn ${remain} từ chưa đánh dấu`;

    // Thanh progress
    const percent = (known / total) * 100;
    document.querySelector(".progress-fill").style.width = percent + "%";
}

function resetProgress() {
    if (!confirm("Bạn có chắc muốn xóa toàn bộ ⭐ không?")) return;

    knownWords.clear();
    localStorage.removeItem("knownWords");

    updateProgress();
    updateTestUI();

    alert("Đã reset tiến độ!");
}

function backToLearn() {
    testScreen.style.display = "none";
    learnScreen.style.display = "block";
    resultScreen.style.display = "none";
}

document.getElementById("testMeaning").onclick = () => {
    testMode = "meaning";
};

document.getElementById("testHanzi").onclick = () => {
    testMode = "hanzi";
};

document.getElementById("testBoth").onclick = () => {
    testMode = "both";
};

const numInput = document.getElementById("numWords");

numInput.addEventListener("focus", () => {
    const row = numInput.closest(".row");
    const buttons = row.querySelectorAll(".test-btn");

    buttons.forEach(b => b.classList.remove("active"));
});

window.backToLearn = backToLearn;
window.startTest = startTest;
window.goBack = goBack;
window.resetProgress = resetProgress;
window.saveKnown = saveKnown;

let voices = [];

function loadVoices() {
    voices = speechSynthesis.getVoices();
}

// gọi ngay
loadVoices();

// và nghe event (quan trọng)
speechSynthesis.onvoiceschanged = loadVoices;

window.speak = speak;