async function getTagCounts() {
  const ordersRef = firebase.database().ref("orders");
  const tagCounts = {};
  
  try {
    const snapshot = await ordersRef.once("value");
    const orders = snapshot.val();
    
    if (!orders) return null;

    Object.values(orders).forEach(orderGroup => {
      Object.values(orderGroup).forEach(order => {
        if (order.items) {
          order.items.forEach(item => {
            if (item.tags) {
              Object.values(item.tags).forEach(tag => {
                tagCounts[tag] = (tagCounts[tag] || 0) + 1;
              });
            }
          });
        }
      });
    });
    console.log(tagCounts);
    
    return tagCounts;
  } catch (error) {
    console.error("Error counting tags:", error);
    return null;
  }
}


async function getRecommendedProducts() {
  const dbRef = firebase.database().ref("products");
  const tagCounts = await getTagCounts();
  
  try {
    const snapshot = await dbRef.once("value");
    const products = [];
    
  
    if (!tagCounts) {
      snapshot.forEach(childSnapshot => {
        products.push({
          id: childSnapshot.key,
          ...childSnapshot.val()
        });
      });
      return shuffleArray(products).slice(0, 10);
    }

  
    const sortedTags = Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1]);

  
    let topTags = [];
    if (sortedTags.length > 0) {
      const maxCount = sortedTags[0][1];
      topTags = sortedTags
        .filter(([_, count]) => count === maxCount)
        .slice(0, 2)
        .map(([tag]) => tag);
    }

  
    const recommendedProducts = new Set();
    snapshot.forEach(childSnapshot => {
      const product = {
        id: childSnapshot.key,
        ...childSnapshot.val()
      };
      
      if (product.tags) {
        const productTags = Object.values(product.tags);
      
        if (topTags.every(tag => productTags.includes(tag))) {
          recommendedProducts.add(product);
        }
      }
    });

  
    if (recommendedProducts.size < 10) {
      const remainingCount = 10 - recommendedProducts.size;
      const allProducts = [];
      snapshot.forEach(childSnapshot => {
        const product = {
          id: childSnapshot.key,
          ...childSnapshot.val()
        };
        if (!Array.from(recommendedProducts).some(p => p.id === product.id)) {
          allProducts.push(product);
        }
      });
      
      shuffleArray(allProducts)
        .slice(0, remainingCount)
        .forEach(product => recommendedProducts.add(product));
    }

  
    return Array.from(recommendedProducts).slice(0, 10);
  } catch (error) {
    console.error("Error fetching recommended products:", error);
    return [];
  }
}

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

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

async function displayProducts() {
  const productList = document.querySelector(".product-list");
  try {
    const products = await getRecommendedProducts();
    productList.innerHTML = "";
    
    products.forEach(product => {
      const productItem = document.createElement("div");
      productItem.className = "product-item";
      productItem.innerHTML = `
        <a href="html/product-detail.html?id=${product.id}">
          <img src="${product.imageUrl || "https://via.placeholder.com/200"}" alt="${product.name}">
          <h3>${product.name}</h3>
          <p>₩${Number(product.price).toLocaleString()}</p>
        </a>
      `;
      
      
      productList.appendChild(productItem);
    });
  } catch (error) {
    console.error("Error displaying products:", error);
  }
}

function onDOMLoaded() {
  initializeSlider();
  displayProducts();
}

fetch("./html/footer.html")
  .then((response) => response.text())
  .then((data) => {
    document.getElementById("footer-container").innerHTML = data;
  })
  .catch((error) =>
    console.error("Footer를 로드하는 중 오류가 발생했습니다:", error)
  );

fetch("./html/header.html")
  .then((response) => response.text())
  .then((data) => {
    document.getElementById("header-container").innerHTML = data;
  })
  .catch((error) =>
    console.error("Header를 로드하는 중 오류가 발생했습니다:", error)
  );

document.addEventListener("DOMContentLoaded", onDOMLoaded);