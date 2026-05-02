const localHosts = ["localhost", "127.0.0.1"];
const isLocalBrowser = localHosts.includes(window.location.hostname) || window.location.protocol === "file:";
const isBackendServer = window.location.port === "3000";
const API_BASE_URL = isLocalBrowser && !isBackendServer ? "http://localhost:3000" : "";
const allFilter = {
  id: "all",
  label: "전체",
};

const filterBar = document.getElementById("filterBar");
const cardGrid = document.getElementById("cardGrid");
const featuredImage = document.getElementById("featuredImage");
const featuredSeason = document.getElementById("featuredSeason");
const featuredMood = document.getElementById("featuredMood");
const detailTitle = document.getElementById("detailTitle");
const detailDescription = document.getElementById("detailDescription");
const detailTheme = document.getElementById("detailTheme");
const detailTool = document.getElementById("detailTool");
const detailMood = document.getElementById("detailMood");
const detailPoint = document.getElementById("detailPoint");
const detailQuote = document.getElementById("detailQuote");
const randomButton = document.getElementById("randomButton");
const messageForm = document.getElementById("messageForm");
const messageNickname = document.getElementById("messageNickname");
const messageSeason = document.getElementById("messageSeason");
const messageText = document.getElementById("messageText");
const messageSubmit = document.getElementById("messageSubmit");
const messageStatus = document.getElementById("messageStatus");
const messageList = document.getElementById("messageList");

let seasonEntries = [allFilter];
let seasonCards = [];
let activeFilter = "all";
let activeSeason = "";

function createTextElement(tagName, className, text) {
  const element = document.createElement(tagName);

  if (className) {
    element.className = className;
  }

  element.textContent = text;
  return element;
}

function showStatus(message, isError = false) {
  cardGrid.innerHTML = "";

  const status = createTextElement("p", "status-message", message);
  status.classList.toggle("status-message-error", isError);
  cardGrid.appendChild(status);
}

function setDetailPlaceholder(message) {
  featuredImage.removeAttribute("src");
  featuredImage.alt = message;
  featuredSeason.textContent = "-";
  featuredMood.textContent = message;
  detailTitle.textContent = message;
  detailDescription.textContent = "";
  detailTheme.textContent = "-";
  detailTool.textContent = "-";
  detailMood.textContent = "-";
  detailPoint.textContent = "-";
  detailQuote.textContent = "백엔드 서버 상태를 확인해 주세요.";
}

async function requestJson(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new Error(data?.message || `${path} 요청 실패: ${response.status}`);
  }

  return data;
}

function buildFilters() {
  filterBar.innerHTML = "";

  seasonEntries.forEach((entry) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "filter-button";
    button.textContent = entry.label;
    button.dataset.filter = entry.id;

    if (entry.id === activeFilter) {
      button.classList.add("is-active");
    }

    button.addEventListener("click", () => {
      activeFilter = entry.id;

      if (entry.id !== "all") {
        activeSeason = entry.id;
      }

      renderFilters();
      renderCards();
      updateDetail(getEntry(activeSeason));
    });

    filterBar.appendChild(button);
  });
}

function renderFilters() {
  const buttons = filterBar.querySelectorAll(".filter-button");

  buttons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.filter === activeFilter);
  });
}

function getEntry(id) {
  return seasonCards.find((entry) => entry.id === id) || seasonCards[0];
}

function getSeasonLabel(id) {
  if (!id) {
    return "시즌 미선택";
  }

  const entry = seasonCards.find((item) => item.id === id);
  return entry ? entry.label : "시즌 미선택";
}

function getVisibleCards() {
  if (activeFilter === "all") {
    return seasonCards;
  }

  return seasonCards.filter((entry) => entry.id === activeFilter);
}

function createCard(entry) {
  const article = document.createElement("article");
  article.className = "card-item";
  article.tabIndex = 0;
  article.setAttribute("role", "button");
  article.setAttribute("aria-label", `${entry.title} 상세 보기`);

  if (entry.id === activeSeason) {
    article.classList.add("is-selected");
  }

  const thumb = document.createElement("div");
  thumb.className = "card-thumb";

  const image = document.createElement("img");
  image.src = entry.image;
  image.alt = `${entry.title} 이미지`;
  image.loading = "lazy";
  image.referrerPolicy = "no-referrer";
  thumb.appendChild(image);

  const cardHead = document.createElement("div");
  cardHead.className = "card-head";
  cardHead.appendChild(createTextElement("h3", "", entry.title));
  cardHead.appendChild(createTextElement("span", "chip", entry.shortLabel));

  const description = createTextElement("p", "card-copy", entry.description);

  const meta = document.createElement("div");
  meta.className = "card-meta";
  [entry.theme, entry.tool, entry.point].forEach((text) => {
    meta.appendChild(createTextElement("span", "", text));
  });

  article.append(thumb, cardHead, description, meta);

  article.addEventListener("click", () => {
    activeSeason = entry.id;
    updateDetail(entry);
    renderCards();
  });

  article.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      activeSeason = entry.id;
      updateDetail(entry);
      renderCards();
    }
  });

  return article;
}

function renderCards() {
  const visibleCards = getVisibleCards();
  cardGrid.innerHTML = "";

  visibleCards.forEach((entry) => {
    cardGrid.appendChild(createCard(entry));
  });
}

function updateDetail(entry) {
  if (!entry) {
    setDetailPlaceholder("표시할 시즌 데이터가 없습니다.");
    return;
  }

  featuredImage.src = entry.image;
  featuredImage.alt = `${entry.title} 대표 이미지`;
  featuredSeason.textContent = entry.label;
  featuredMood.textContent = entry.mood;
  detailTitle.textContent = entry.title;
  detailDescription.textContent = entry.description;
  detailTheme.textContent = entry.theme;
  detailTool.textContent = entry.tool;
  detailMood.textContent = entry.mood;
  detailPoint.textContent = entry.point;
  detailQuote.textContent = entry.quote;

  if (messageSeason) {
    messageSeason.value = entry.id;
  }
}

function buildMessageSeasonOptions() {
  messageSeason.innerHTML = "";

  seasonCards.forEach((entry) => {
    const option = document.createElement("option");
    option.value = entry.id;
    option.textContent = entry.label;
    messageSeason.appendChild(option);
  });

  messageSeason.value = activeSeason;
}

function setMessageStatus(message, isError = false) {
  messageStatus.textContent = message;
  messageStatus.classList.toggle("is-error", isError);
}

function formatMessageTime(value) {
  if (!value) {
    return "";
  }

  return new Intl.DateTimeFormat("ko-KR", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function renderMessages(messages) {
  messageList.innerHTML = "";

  if (!messages.length) {
    messageList.appendChild(createTextElement("p", "status-message", "아직 저장된 메시지가 없습니다."));
    return;
  }

  messages.forEach((item) => {
    const article = document.createElement("article");
    article.className = "message-item";

    const header = document.createElement("div");
    header.className = "message-item-head";
    header.appendChild(createTextElement("strong", "", item.nickname));
    header.appendChild(createTextElement("span", "", formatMessageTime(item.created_at)));

    const meta = createTextElement("p", "message-item-meta", getSeasonLabel(item.season_id));
    const copy = createTextElement("p", "message-item-copy", item.message);

    article.append(header, meta, copy);
    messageList.appendChild(article);
  });
}

async function loadMessages() {
  try {
    const messages = await requestJson("/api/messages");
    renderMessages(Array.isArray(messages) ? messages : []);
  } catch (error) {
    console.error(error);
    messageList.innerHTML = "";
    messageList.appendChild(createTextElement("p", "status-message status-message-error", error.message));
  }
}

async function handleMessageSubmit(event) {
  event.preventDefault();

  try {
    messageSubmit.disabled = true;
    setMessageStatus("메시지를 저장하는 중입니다.");

    await requestJson("/api/messages", {
      method: "POST",
      body: JSON.stringify({
        nickname: messageNickname.value,
        seasonId: messageSeason.value,
        message: messageText.value,
      }),
    });

    messageText.value = "";
    setMessageStatus("Supabase에 메시지를 저장했습니다.");
    await loadMessages();
  } catch (error) {
    console.error(error);
    setMessageStatus(error.message, true);
  } finally {
    messageSubmit.disabled = false;
  }
}

async function loadSeasons() {
  try {
    randomButton.disabled = true;
    setDetailPlaceholder("도감 데이터를 불러오는 중입니다.");
    showStatus("백엔드에서 도감 데이터를 불러오는 중입니다.");

    seasonCards = await requestJson("/api/seasons");

    if (!Array.isArray(seasonCards) || seasonCards.length === 0) {
      throw new Error("시즌 데이터가 비어 있습니다.");
    }

    seasonEntries = [allFilter, ...seasonCards];
    activeFilter = "all";
    activeSeason = seasonCards[0].id;

    buildFilters();
    buildMessageSeasonOptions();
    updateDetail(getEntry(activeSeason));
    renderCards();
    await loadMessages();
    randomButton.disabled = false;
  } catch (error) {
    console.error(error);
    filterBar.innerHTML = "";
    randomButton.disabled = true;
    setDetailPlaceholder("백엔드 연결이 필요합니다.");
    showStatus("터미널에서 node backend/server.js를 실행한 뒤 새로고침하세요.", true);
  }
}

async function pickRandomSeason() {
  try {
    randomButton.disabled = true;
    const randomEntry = await requestJson("/api/seasons/random");

    activeFilter = randomEntry.id;
    activeSeason = randomEntry.id;

    renderFilters();
    updateDetail(randomEntry);
    renderCards();
  } catch (error) {
    console.error(error);
    showStatus("랜덤 시즌을 가져오지 못했습니다. 백엔드 서버를 확인해 주세요.", true);
  } finally {
    randomButton.disabled = false;
  }
}

randomButton.addEventListener("click", pickRandomSeason);
messageForm.addEventListener("submit", handleMessageSubmit);
loadSeasons();
