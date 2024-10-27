firebase.auth().onAuthStateChanged(function(user) {
    if (user) {
      const ordersRef = firebase.database().ref("orders/" + user.uid);
      const orderListContainer = document.getElementById("order-list");
  
      ordersRef.once("value").then((snapshot) => {
        if (snapshot.exists()) {
          snapshot.forEach((childSnapshot) => {
            const orderData = childSnapshot.val();
            const orderDiv = document.createElement("div");
            orderDiv.classList.add("order-item");
  
            // 주문 내역 표시
            orderDiv.innerHTML = `
              <h3>주문 번호: ${orderData.orderId}</h3>
              <p>주문 날짜: ${new Date(orderData.orderDate).toLocaleDateString()}</p>
              <ul>
                ${orderData.items
                  .map(
                    (item) => {
                      console.log("상품 데이터:", item); // 추가된 로그

                      // productPrice를 숫자로 변환
                      const productPrice = Number(item.price);
                      const totalPrice = productPrice * item.quantity;
  
                      return `
                        <li>
                          <p>상품명: ${item.productName}</p>
                          <p>수량: ${item.quantity}</p>
                          <p>가격: ₩${totalPrice.toLocaleString()}</p> <!-- 총 가격 표시 -->
                        </li>
                      `;
                    }
                  )
                  .join("")}
              </ul>
              <p>총 결제 금액: ₩${orderData.totalAmount.toLocaleString()}</p>
              <hr />
            `;
            orderListContainer.appendChild(orderDiv);
          });
        } else {
          orderListContainer.innerHTML = "<p>주문 내역이 없습니다.</p>";
        }
      }).catch((error) => {
        console.error("주문 내역 불러오기 오류:", error);
        orderListContainer.innerHTML = "<p>주문 내역을 불러오는 중 오류가 발생했습니다.</p>";
      });
    } else {
      window.location.href = "login.html";
    }
  });
  