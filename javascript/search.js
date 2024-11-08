function searchProducts() {
  const searchInput = document.getElementById("search-input");
  const resultsContainer = document.getElementById("search-results");
  resultsContainer.innerHTML = "";

  if (!searchInput.value.trim()) {
    resultsContainer.innerHTML = "<p>검색어를 입력하세요.</p>";
    return;
  }

  saveSearchHistory(searchInput.value.trim());

  const dbRef = firebase.database().ref("products");
  dbRef
    .once("value")
    .then((snapshot) => {
      const products = snapshot.val();
      const results = [];

      Object.keys(products).forEach((id) => {
        const product = products[id];
        if (
          product.name.includes(searchInput.value.trim()) ||
          (product.description &&
            product.description.includes(searchInput.value.trim()))
        ) {
          results.push({
            id,
            ...product,
          });
        }
      });

      if (results.length > 0) {
        results.forEach((product) => {
          const productElement = document.createElement("div");
          productElement.className = "product-item";
          productElement.innerHTML = `
                <a href="product-detail.html?id=${product.id}">
                  <img src="${
                    product.imageUrl || "https://via.placeholder.com/200"
                  }" alt="${product.name}">
                  <h3>${product.name}</h3>
                  <p>₩${Number(product.price).toLocaleString()}</p>
                </a>
              `;
          resultsContainer.appendChild(productElement);
        });
      } else {
        resultsContainer.innerHTML = "<p>검색 결과가 없습니다.</p>";
      }
    })
    .catch((error) => {
      console.error("Error fetching search results:", error);
      resultsContainer.innerHTML = "<p>검색 중 오류가 발생했습니다.</p>";
    });
}

function saveSearchHistory(searchTerm) {
  let searchHistory = JSON.parse(localStorage.getItem("searchHistory")) || [];

  if (!searchHistory.includes(searchTerm)) {
    if (searchHistory.length >= 10) {
      searchHistory.shift();
    }
    searchHistory.push(searchTerm);
    localStorage.setItem("searchHistory", JSON.stringify(searchHistory));
  }

  displaySearchHistory();
}

function displaySearchHistory() {
  const historyContainer = document.getElementById("search-history");
  historyContainer.innerHTML = "";

  const searchHistory = JSON.parse(localStorage.getItem("searchHistory")) || [];

  if (searchHistory.length === 0) {
    historyContainer.innerHTML = "<p>검색 기록이 없습니다.</p>";
    return;
  }

  searchHistory.forEach((term, index) => {
    const historyItem = document.createElement("div");
    historyItem.className = "history-item";
    historyItem.innerHTML = `
          <span class="history-term" onclick="useSearchHistory('${term}')">${term}</span>
          <button onclick="deleteSearchHistory(${index})">❌</button>
        `;
    historyContainer.appendChild(historyItem);
  });

  const historyTerms = document.querySelectorAll(".history-term");
  historyTerms.forEach((term) => {
    term.addEventListener("mouseover", () => {
      term.style.cursor = "pointer";
      term.style.textDecoration = "underline";
      term.style.color = "inherit";
    });
    term.addEventListener("mouseout", () => {
      term.style.cursor = "default";
      term.style.textDecoration = "none";
      term.style.color = "inherit";
    });
  });
}

function deleteSearchHistory(index) {
  let searchHistory = JSON.parse(localStorage.getItem("searchHistory")) || [];
  searchHistory.splice(index, 1);
  localStorage.setItem("searchHistory", JSON.stringify(searchHistory));
  displaySearchHistory();
}

function clearSearchHistory() {
  localStorage.removeItem("searchHistory");
  displaySearchHistory();
}

function useSearchHistory(term) {
  document.getElementById("search-input").value = term;
  searchProducts();
}

document.addEventListener("DOMContentLoaded", displaySearchHistory);

document.getElementById("search-input").addEventListener("keyup", (event) => {
  if (event.key === "Enter") {
    searchProducts();
  }
});
