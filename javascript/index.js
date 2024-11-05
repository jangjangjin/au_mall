// 슬라이더 기능
function initializeSlider() {
  let currentIndex = 0;
  const slides = document.querySelectorAll(".slide");
  const totalSlides = slides.length;
  const dots = document.querySelectorAll(".dot");

  function showSlide(index) {
    const slidesContainer = document.querySelector(".slides");
    slidesContainer.style.transform = `translateX(-${index * 100}%)`;
    dots.forEach((dot) => dot.classList.remove("active"));
    dots[index].classList.add("active");
  }

  function nextSlide() {
    currentIndex = (currentIndex + 1) % totalSlides;
    showSlide(currentIndex);
  }

  function prevSlide() {
    currentIndex = (currentIndex - 1 + totalSlides) % totalSlides;
    showSlide(currentIndex);
  }

  document.querySelector(".next").addEventListener("click", nextSlide);
  document.querySelector(".prev").addEventListener("click", prevSlide);

  dots.forEach((dot, index) => {
    dot.setAttribute("data-index", index);
    dot.addEventListener("click", function () {
      currentIndex = parseInt(this.getAttribute("data-index"));
      showSlide(currentIndex);
    });
  });

  setInterval(nextSlide, 3000);
  showSlide(currentIndex);
}

// 추천 상품 리스트 추가
function displayProducts() {
  const productList = document.querySelector(".product-list");
  const dbRef = firebase.database().ref("products");
  dbRef
    .limitToFirst(10)
    .once("value")
    .then((snapshot) => {
      productList.innerHTML = "";
      snapshot.forEach((childSnapshot) => {
        const product = childSnapshot.val();
        const productId = childSnapshot.key;
        const productItem = document.createElement("div");
        productItem.className = "product-item";
        productItem.innerHTML = `
            <a href="html/product-detail.html?id=${productId}">
              <img src="${
                product.imageUrl || "https://via.placeholder.com/200"
              }" alt="${product.name}">
              <h3>${product.name}</h3>
              <p>₩${Number(product.price).toLocaleString()}</p>
            </a>
          `;
        productList.appendChild(productItem);
      });
    })
    .catch((error) => {
      console.error("Error fetching products: ", error);
    });
}

function onDOMLoaded() {
  initializeSlider();
  displayProducts();
}

// footer 로드
fetch("./html/footer.html")
  .then((response) => response.text())
  .then((data) => {
    document.getElementById("footer-container").innerHTML = data;
  })
  .catch((error) =>
    console.error("Footer를 로드하는 중 오류가 발생했습니다:", error)
  );
// header 로드
fetch("./html/header.html")
  .then((response) => response.text())
  .then((data) => {
    document.getElementById("header-container").innerHTML = data;
  })
  .catch((error) =>
    console.error("Header를 로드하는 중 오류가 발생했습니다:", error)
  );

document.addEventListener("DOMContentLoaded", onDOMLoaded);
