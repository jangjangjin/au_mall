const styleSheet = document.createElement("style");
styleSheet.textContent = `
  .reviews-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
  }

  .review-item {
    background-color: white;
    border-radius: 8px;
    padding: 20px;
    margin-bottom: 20px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .product-info {
    display: flex;
    align-items: center;
    margin-bottom: 15px;
    padding-bottom: 15px;
    border-bottom: 1px solid #eee;
  }

  .product-name {
    font-size: 18px;
    font-weight: bold;
    margin-right: 15px;
  }

  .review-meta {
    display: flex;
    justify-content: space-between;
    color: #666;
    font-size: 14px;
    margin-bottom: 10px;
  }

  .star-rating {
    color: #ffd700;
    font-size: 18px;
    margin-bottom: 10px;
  }

  .review-text {
    font-size: 16px;
    line-height: 1.6;
    color: #333;
  }

  .no-reviews {
    text-align: center;
    padding: 40px;
    color: #666;
    font-size: 16px;
  }

  .loading-spinner {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 200px;
  }
`;
document.head.appendChild(styleSheet);

document.addEventListener("DOMContentLoaded", async function () {
  const reviewsContainer = document.querySelector(".reviews-container");
  const loadingSpinner = document.getElementById("loading-spinner");

  const urlParams = new URLSearchParams(window.location.search);
  const productId = urlParams.get("productId");

  if (!productId) {
    reviewsContainer.innerHTML =
      '<div class="no-reviews">상품 정보를 찾을 수 없습니다.</div>';
    return;
  }

  async function loadProductInfo(productId) {
    try {
      const productRef = firebase.database().ref(`products/${productId}`);
      const snapshot = await productRef.once("value");
      return snapshot.val() || { name: "삭제된 상품" };
    } catch (error) {
      console.error("상품 정보 로딩 중 오류:", error);
      return { name: "상품 정보 로드 실패" };
    }
  }

  async function loadUserInfo(userId) {
    try {
      const userRef = firebase.database().ref(`users/${userId}`);
      const snapshot = await userRef.once("value");
      return snapshot.val() || { username: "알 수 없는 사용자" };
    } catch (error) {
      console.error("사용자 정보 로딩 중 오류:", error);
      return { username: "알 수 없는 사용자" };
    }
  }

  async function displayReviews() {
    try {
      loadingSpinner.style.display = "flex";
      reviewsContainer.innerHTML = "";

      const productInfo = await loadProductInfo(productId);

      const reviewsRef = firebase
        .database()
        .ref("reviews")
        .orderByChild("productId")
        .equalTo(productId);

      const snapshot = await reviewsRef.once("value");

      if (!snapshot.exists()) {
        reviewsContainer.innerHTML =
          '<div class="no-reviews">아직 작성된 리뷰가 없습니다.</div>';
        return;
      }

      const reviews = [];
      snapshot.forEach((childSnapshot) => {
        reviews.push({
          id: childSnapshot.key,
          ...childSnapshot.val(),
        });
      });

      reviews.sort((a, b) => b.timestamp - a.timestamp);

      for (const review of reviews) {
        const reviewElement = document.createElement("div");
        reviewElement.className = "review-item";

        const stars = "★".repeat(review.rating) + "☆".repeat(5 - review.rating);

        const userData = await loadUserInfo(review.userId);

        reviewElement.innerHTML = `
          <div class="product-info">
            <div class="product-name">${productInfo.name}</div>
          </div>
          <div class="review-meta">
            <span>작성자: ${userData.username}</span>
            <span>${new Date(review.timestamp).toLocaleDateString("ko-KR", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}</span>
          </div>
          <div class="star-rating">${stars}</div>
          <div class="review-text">${review.text || review.review}</div>
        `;

        reviewsContainer.appendChild(reviewElement);
      }
    } catch (error) {
      console.error("리뷰 데이터 로딩 중 오류:", error);
      reviewsContainer.innerHTML =
        '<div class="no-reviews">리뷰를 불러오는 중 오류가 발생했습니다.</div>';
    } finally {
      loadingSpinner.style.display = "none";
    }
  }

  displayReviews();
});
