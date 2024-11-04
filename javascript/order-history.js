const styleSheet = document.createElement("style");
styleSheet.textContent = `
  .review-section {
    margin-top: 10px;
    padding: 10px;
    background-color: #f9f9f9;
    border-radius: 5px;
  }

  .star-rating {
    display: inline-block;
    font-size: 20px;
    cursor: pointer;
  }

  .star-rating span {
    color: #ddd;
    margin-right: 2px;
  }

  .star-rating span.active {
    color: #ffd700;
  }

  .review-form {
    display: none;
    margin-top: 10px;
  }

  .review-form.show {
    display: block;
  }

  .review-textarea {
    width: 100%;
    min-height: 100px;
    margin-bottom: 10px;
    padding: 8px;
    border: 1px solid #ddd;
    border-radius: 4px;
  }

  .review-submit {
    background-color: #4CAF50;
    color: white;
    padding: 8px 16px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }

  .review-submit:hover {
    background-color: #45a049;
  }

  .existing-review {
    margin-top: 10px;
    padding: 10px;
    background-color: #fff;
    border: 1px solid #ddd;
    border-radius: 4px;
  }
`;
document.head.appendChild(styleSheet);

firebase.auth().onAuthStateChanged(function (user) {
  if (user) {
    const ordersRef = firebase.database().ref("orders/" + user.uid);
    const orderListContainer = document.getElementById("order-list");

    ordersRef
      .once("value")
      .then((snapshot) => {
        if (snapshot.exists()) {
          snapshot.forEach((childSnapshot) => {
            const orderData = childSnapshot.val();
            const items = orderData.items || [];
            const orderDiv = document.createElement("div");
            orderDiv.classList.add("order-item");

            orderDiv.innerHTML = `
            <h3>주문 번호: ${orderData.orderId}</h3>
            <p>주문 날짜: ${new Date(
              orderData.orderDate
            ).toLocaleDateString()}</p>
            <ul>
              ${items
                .map((item) => {
                  // items 배열의 각 항목에서 필요한 정보 추출
                  return `
                  <li>
                    <p>상품명: ${item.productName}</p>
                    <p>수량: ${item.quantity}</p>
                    <p>가격: ₩${Number(item.totalPrice).toLocaleString()}</p>
                    <div class="review-section" 
                         data-product-id="${item.productId}"
                         data-order-id="${orderData.orderId}">
                      <button class="write-review-btn">리뷰 작성하기</button>
                      <div class="review-form">
                        <div class="star-rating">
                          <span data-rating="1">★</span>
                          <span data-rating="2">★</span>
                          <span data-rating="3">★</span>
                          <span data-rating="4">★</span>
                          <span data-rating="5">★</span>
                        </div>
                        <textarea class="review-textarea" placeholder="리뷰를 작성해주세요"></textarea>
                        <button class="review-submit">리뷰 등록</button>
                      </div>
                      <div class="existing-review"></div>
                    </div>
                  </li>
                `;
                })
                .join("")}
            </ul>
            <p>총 결제 금액: ₩${Number(
              orderData.totalAmount
            ).toLocaleString()}</p>
            <hr />
          `;
            orderListContainer.appendChild(orderDiv);

            // 리뷰 관련 이벤트 리스너 추가
            const reviewSections = orderDiv.querySelectorAll(".review-section");
            reviewSections.forEach((section) => {
              const productId = section.dataset.productId;
              const orderId = section.dataset.orderId;

              console.log("리뷰 섹션 초기화:", {
                productId,
                orderId,
                sectionHTML: section.outerHTML,
              });

              const writeReviewBtn = section.querySelector(".write-review-btn");
              const reviewForm = section.querySelector(".review-form");
              const stars = section.querySelectorAll(".star-rating span");
              const reviewTextarea = section.querySelector(".review-textarea");
              const submitBtn = section.querySelector(".review-submit");
              const existingReviewDiv =
                section.querySelector(".existing-review");

              if (!productId) {
                console.error("상품 ID 누락:", {
                  orderId,
                  section: section.outerHTML,
                });
                return;
              }

              // 기존 리뷰 로드
              loadExistingReview(
                user.uid,
                productId,
                orderId,
                existingReviewDiv
              );

              let selectedRating = 0;

              writeReviewBtn.addEventListener("click", () => {
                reviewForm.classList.toggle("show");
              });

              // 별점 이벤트
              stars.forEach((star) => {
                star.addEventListener("mouseover", () => {
                  const rating = parseInt(star.dataset.rating);
                  highlightStars(stars, rating);
                });

                star.addEventListener("click", () => {
                  selectedRating = parseInt(star.dataset.rating);
                  highlightStars(stars, selectedRating);
                });
              });

              // 별점 영역 마우스 아웃 시
              section
                .querySelector(".star-rating")
                .addEventListener("mouseout", () => {
                  highlightStars(stars, selectedRating);
                });

              // 리뷰 제출
              submitBtn.addEventListener("click", () => {
                const reviewText = reviewTextarea.value.trim();
                if (selectedRating === 0) {
                  alert("별점을 선택해주세요.");
                  return;
                }
                if (reviewText === "") {
                  alert("리뷰 내용을 작성해주세요.");
                  return;
                }

                const reviewData = {
                  userId: user.uid,
                  productId: productId,
                  orderId: orderId,
                  rating: selectedRating,
                  review: reviewText,
                  timestamp: Date.now(),
                  productName: section
                    .closest("li")
                    .querySelector("p")
                    .textContent.replace("상품명: ", ""),
                };

                console.log("리뷰 제출 데이터:", reviewData);

                saveReview(reviewData, existingReviewDiv);
                reviewForm.classList.remove("show");
                reviewTextarea.value = "";
                selectedRating = 0;
                highlightStars(stars, 0);
              });
            });
          });
        } else {
          orderListContainer.innerHTML = "<p>주문 내역이 없습니다.</p>";
        }
      })
      .catch((error) => {
        console.error("주문 내역 불러오기 오류:", error);
        orderListContainer.innerHTML =
          "<p>주문 내역을 불러오는 중 오류가 발생했습니다.</p>";
      });
  } else {
    window.location.href = "login.html";
  }
});

function highlightStars(stars, rating) {
  stars.forEach((star, index) => {
    star.classList.toggle("active", index < rating);
  });
}

function saveReview(reviewData, existingReviewDiv) {
  const reviewsRef = firebase.database().ref("reviews");

  reviewsRef
    .orderByChild("orderId")
    .equalTo(reviewData.orderId)
    .once("value")
    .then((snapshot) => {
      let existingReview = false;
      snapshot.forEach((childSnapshot) => {
        const review = childSnapshot.val();
        if (review.productId === reviewData.productId) {
          existingReview = true;

          childSnapshot.ref
            .update(reviewData)
            .then(() => {
              displayReview(reviewData, existingReviewDiv);
              alert("리뷰가 수정되었습니다.");
            })
            .catch((error) => {
              console.error("리뷰 수정 오류:", error);
              alert("리뷰 수정 중 오류가 발생했습니다.");
            });
        }
      });

      if (!existingReview) {
        reviewsRef
          .push(reviewData)
          .then(() => {
            displayReview(reviewData, existingReviewDiv);
            alert("리뷰가 등록되었습니다.");
          })
          .catch((error) => {
            console.error("리뷰 저장 오류:", error);
            alert("리뷰 등록 중 오류가 발생했습니다.");
          });
      }
    });
}

function loadExistingReview(userId, productId, orderId, existingReviewDiv) {
  const reviewsRef = firebase.database().ref("reviews");

  reviewsRef
    .orderByChild("orderId")
    .equalTo(orderId)
    .once("value")
    .then((snapshot) => {
      snapshot.forEach((childSnapshot) => {
        const review = childSnapshot.val();
        if (review.productId === productId && review.userId === userId) {
          displayReview(review, existingReviewDiv);
        }
      });
    })
    .catch((error) => {
      console.error("리뷰 불러오기 오류:", error);
    });
}

function displayReview(reviewData, container) {
  const stars =
    "★".repeat(reviewData.rating) + "☆".repeat(5 - reviewData.rating);
  container.innerHTML = `
    <div>
      <p><strong>별점:</strong> ${stars}</p>
      <p><strong>리뷰:</strong> ${reviewData.review}</p>
      <p><small>작성일: ${new Date(
        reviewData.timestamp
      ).toLocaleDateString()}</small></p>
    </div>
  `;
}
