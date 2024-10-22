// IMP 초기화
var IMP = window.IMP;
IMP.init("imp67622846"); // 실제 가맹점 식별코드로 변경 필요

document.addEventListener("DOMContentLoaded", function () {
  // 총 결제 금액 초기화
  document.getElementById("total-price").textContent = "₩0";

  // 전체 선택 체크박스 체크
  document.getElementById("select-all").checked = true;

  firebase.auth().onAuthStateChanged(function (user) {
    if (user) {
      const userId = user.uid;
      const cartRef = firebase.database().ref("carts/" + userId);
      const cartContainer = document.getElementById("cart-items");

      // 장바구니 데이터 가져오기
      cartRef.on("value", (snapshot) => {
        const cartItems = snapshot.val();
        cartContainer.innerHTML = ""; // 초기화

        let totalPrice = 0; // 총 결제 금액 초기화

        if (cartItems) {
          Object.keys(cartItems).forEach((key) => {
            const item = cartItems[key];
            const itemTotalPrice = item.productPrice * item.quantity; // 상품 총 가격 계산
            totalPrice += itemTotalPrice; // 총 결제 금액 업데이트

            // 장바구니 항목 생성
            const cartItemDiv = document.createElement("div");
            cartItemDiv.classList.add("cart-item");
            cartItemDiv.dataset.key = item.productId; // 상품 키 추가
            cartItemDiv.innerHTML = `
                <input type="checkbox" class="item-checkbox" checked />
                <img src="${
                  item.productImage || "https://via.placeholder.com/100"
                }" alt="${item.productName}" />
                <div class="item-info">
                    <h3>${item.productName}</h3>
                    <p>₩${item.productPrice.toLocaleString()}</p>
                    <div class="item-quantity">
                        <button class="quantity-btn" data-action="decrease" data-key="${key}">-</button>
                        <span class="quantity">${item.quantity}</span>
                        <button class="quantity-btn" data-action="increase" data-key="${key}">+</button>
                    </div>
                </div>
                <button class="remove-item" data-key="${key}">제거</button>
            `;
            cartContainer.appendChild(cartItemDiv);
          });

          // 총 결제 금액 업데이트
          document.getElementById(
            "total-price"
          ).textContent = `₩${totalPrice.toLocaleString()}`;
        } else {
          cartContainer.innerHTML = "<p>장바구니가 비어 있습니다.</p>";
        }
      });

      // 전체 선택 체크박스 이벤트 처리
      document
        .getElementById("select-all")
        .addEventListener("change", function () {
          const checkboxes = document.querySelectorAll(".item-checkbox");
          checkboxes.forEach((checkbox) => (checkbox.checked = this.checked));
          updateTotalPrice();
        });

      // 장바구니 컨테이너 이벤트 위임
      cartContainer.addEventListener("click", async function (e) {
        const target = e.target;
        const action = target.dataset.action;
        const key = target.dataset.key;

        // 수량 조정
        if (action === "increase" || action === "decrease") {
          const quantitySpan = target.parentElement.querySelector(".quantity");
          let quantity = parseInt(quantitySpan.textContent, 10);

          if (action === "increase") {
            quantity++;
          } else if (action === "decrease" && quantity > 1) {
            quantity--;
          }

          // 수량 업데이트
          try {
            await cartRef.child(key).update({ quantity: quantity });
            console.log("수량 업데이트 성공:", quantity);
            updateTotalPrice();
          } catch (error) {
            console.error("수량 업데이트 중 오류 발생:", error);
          }
        }

        // 항목 제거
        if (target.classList.contains("remove-item")) {
          const cartItemDiv = target.parentElement;
          const itemQuantity = parseInt(
            cartItemDiv.querySelector(".quantity").textContent,
            10
          );
          const productKey = cartItemDiv.dataset.key;

          try {
            // 장바구니에서 제거
            await cartRef.child(key).remove();
            console.log("장바구니 항목 제거 성공:", key);

            // 재고 복구
            const productRef = firebase
              .database()
              .ref("products/" + productKey);
            const snapshot = await productRef.once("value");
            const product = snapshot.val();

            if (product) {
              const newQuantity = (product.quantity || 0) + itemQuantity;
              await productRef.update({ quantity: newQuantity });
              console.log("재고 업데이트 성공:", newQuantity);
            }

            cartItemDiv.remove();
            updateTotalPrice();
          } catch (error) {
            console.error("항목 제거 중 오류 발생:", error);
          }
        }

        // 체크박스 변경
        if (target.classList.contains("item-checkbox")) {
          updateTotalPrice();
        }
      });

      // 결제 버튼 이벤트 처리
      document
        .getElementById("checkout")
        .addEventListener("click", processPayment);
    } else {
      alert("로그인 해주세요.");
      window.location.href = "./login.html";
    }
  });
});

// 총 결제 금액 업데이트 함수
function updateTotalPrice() {
  const checkboxes = document.querySelectorAll(".item-checkbox");
  let totalPrice = 0;

  checkboxes.forEach((checkbox) => {
    if (checkbox.checked) {
      const cartItemDiv = checkbox.parentElement;
      const price = parseInt(
        cartItemDiv.querySelector("p").textContent.replace(/[^0-9]/g, ""),
        10
      );
      const quantity = parseInt(
        cartItemDiv.querySelector(".quantity").textContent,
        10
      );
      totalPrice += price * quantity;
    }
  });

  document.getElementById(
    "total-price"
  ).textContent = `₩${totalPrice.toLocaleString()}`;
}

// 선택된 상품 정보 가져오기
function getSelectedItems() {
  const selectedItems = [];
  const checkboxes = document.querySelectorAll(".item-checkbox:checked");

  checkboxes.forEach((checkbox) => {
    const itemDiv = checkbox.closest(".cart-item");
    const itemInfo = {
      productId: itemDiv.dataset.key,
      productName: itemDiv.querySelector("h3").textContent,
      productPrice: parseInt(
        itemDiv.querySelector("p").textContent.replace(/[^0-9]/g, ""),
        10
      ),
      quantity: parseInt(itemDiv.querySelector(".quantity").textContent, 10),
    };
    selectedItems.push(itemInfo);
  });

  return selectedItems;
}

// 결제 처리 함수
async function processPayment() {
  // 로그인 체크
  const user = firebase.auth().currentUser;
  if (!user) {
    alert("로그인이 필요합니다!");
    window.location.href = "./login.html";
    return;
  }

  // 선택된 상품 확인
  const selectedItems = getSelectedItems();
  if (selectedItems.length === 0) {
    alert("선택된 상품이 없습니다.");
    return;
  }

  // 총 결제 금액 계산
  const totalAmount = selectedItems.reduce((total, item) => {
    return total + item.productPrice * item.quantity;
  }, 0);

  // 주문 번호 생성
  const now = new Date();
  const merchantUid = `IMP${now.getHours()}${now.getMinutes()}${now.getSeconds()}${now.getMilliseconds()}`;

  // 결제 요청
  if (confirm("선택하신 상품을 구매하시겠습니까?")) {
    IMP.request_pay(
      {
        pg: "kakaopay.TC0ONETIME",
        pay_method: "card",
        merchant_uid: merchantUid,
        name: `${selectedItems[0].productName} ${
          selectedItems.length > 1 ? `외 ${selectedItems.length - 1}건` : ""
        }`,
        amount: totalAmount,
        buyer_email: user.email,
        buyer_name: user.displayName || "구매자",
      },
      async function (rsp) {
        if (rsp.success) {
          try {
            // 주문 정보 저장
            const orderRef = firebase.database().ref("orders/" + user.uid);
            const cartRef = firebase.database().ref("carts/" + user.uid);
            const orderItems = selectedItems.map((item) => ({
              productId: item.productId,
              productName: item.productName,
              quantity: item.quantity,
              price: item.productPrice,
              totalPrice: item.productPrice * item.quantity,
            }));
            const orderData = {
              orderId: rsp.merchant_uid,
              orderDate: new Date().toISOString(),
              paymentId: rsp.imp_uid,
              totalAmount: rsp.paid_amount,
              // 구매자 정보 추가
              buyer: {
                name: user.displayName || "구매자",
                email: user.email,
                uid: user.uid,
              },
              // 주문 상품 정보
              items: orderItems,
              // 대표 상품명 (for 주문 목록 표시)
              mainProductName: `${selectedItems[0].productName} ${
                selectedItems.length > 1
                  ? `외 ${selectedItems.length - 1}건`
                  : ""
              }`,
              // 주문 상태
              status: "paid",
              // 결제 정보
              payment: {
                method: rsp.pay_method,
                pgProvider: rsp.pg_provider,
                pgTid: rsp.pg_tid,
                receiptUrl: rsp.receipt_url,
              },
            };

            // 트랜잭션 처리
            await firebase
              .database()
              .ref()
              .update({
                [`orders/${user.uid}/${rsp.merchant_uid}`]: orderData,
              });

            // 결제 완료된 상품 장바구니에서 제거 및 재고 감소
            for (const item of selectedItems) {
              // 장바구니에서 제거
              await cartRef.child(item.productId).remove();

              // 재고 감소
              const productRef = firebase
                .database()
                .ref("products/" + item.productId);
              await productRef.transaction((product) => {
                if (product) {
                  product.quantity -= item.quantity;
                }
                return product;
              });
            }

            alert("결제가 완료되었습니다!");
            window.location.href = "./cart.html";
          } catch (error) {
            console.error("결제 후 처리 중 오류 발생:", error);
            alert(
              "결제는 완료되었으나 주문 처리 중 오류가 발생했습니다. 고객센터로 문의해주세요."
            );
          }
        } else {
          let message = "결제에 실패하였습니다.";
          if (rsp.error_msg) {
            message += "\n" + rsp.error_msg;
          }
          alert(message);
        }
      }
    );
  }
}
