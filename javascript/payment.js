// IMP 초기화
var IMP = window.IMP;
IMP.init("imp67622846"); // 실제 가맹점 식별코드로 변경 필요

firebase.auth().onAuthStateChanged(function (user) {
  if (user) {
    const userId = user.uid;
    const cartRef = firebase.database().ref("carts/" + userId);
    const orderSummaryContainer = document.querySelector(".order-summary");
    let totalPrice = 0; // 총 결제 금액 변수 초기화
    let selectedItems = []; // 선택된 아이템 저장용 배열

    cartRef.on("value", (snapshot) => {
      const cartItems = snapshot.val();
      orderSummaryContainer.innerHTML = `<h3>주문한 상품</h3>`; // 초기화
      selectedItems = []; // selectedItems 초기화

      if (cartItems) {
        Object.keys(cartItems).forEach((key) => {
          const item = cartItems[key];
          const itemTotalPrice = item.productPrice * item.quantity; // 상품 총 가격 계산
          totalPrice += itemTotalPrice; // 총 결제 금액 업데이트

          // selectedItems에 추가
          selectedItems.push({
            productId: key,
            productName: item.productName,
            quantity: item.quantity,
            productPrice: item.productPrice,
          });

          // 주문한 상품 항목 생성
          const orderItemDiv = document.createElement("div");
          orderItemDiv.classList.add("order-item");
          orderItemDiv.innerHTML = `
            <img src="${
              item.productImage || "https://via.placeholder.com/100"
            }" alt="상품 이미지" />
            <div class="item-info">
              <h4>${item.productName}</h4>
              <p>${item.productDescription}</p>
              <p>₩${item.productPrice.toLocaleString()}</p>
              <p>수량: ${item.quantity}개</p>
            </div>
          `;
          orderSummaryContainer.appendChild(orderItemDiv);
        });

        // 총 결제 금액 요소를 동적으로 생성
        const orderTotalContainer = document.querySelector(".order-total");
        orderTotalContainer.innerHTML = ""; // 초기화

        const totalDiv = document.createElement("h3");
        totalDiv.innerHTML = `총 결제 금액: <span id="total-price">₩${totalPrice.toLocaleString()}</span>`;
        orderTotalContainer.appendChild(totalDiv); // 총 금액 요소 추가

        // 주문하기 버튼 생성 및 이벤트 처리
        const placeOrderButton = document.createElement("button");
        placeOrderButton.id = "place-order";
        placeOrderButton.innerHTML = "결제하기";
        orderTotalContainer.appendChild(placeOrderButton);

        //주문하기 버튼 클릭시 이벤트 처리 구현
        placeOrderButton.addEventListener("click", function () {
          const user = firebase.auth().currentUser;
          if (!user) {
            alert("로그인이 필요합니다!");
            window.location.href = "./login.html";
            return;
          }

          // 배송 정보 가져오기
          const address =
            document.getElementById("sample5_address").value +
            " " +
            document.getElementById("detailed-address").value; // 주소 + 상세 주소
          const phoneNumber = document.getElementById("phone").value; // 전화번호

          // 주문 번호 생성
          const now = new Date();
          const merchantUid = `IMP${now.getHours()}${now.getMinutes()}${now.getSeconds()}${now.getMilliseconds()}`;

          // 결제 요청
          const totalAmount = totalPrice; // totalPrice를 totalAmount로 할당
          if (confirm("선택하신 상품을 구매하시겠습니까?")) {
            IMP.request_pay(
              {
                pg: "kakaopay.TC0ONETIME",
                pay_method: "card",
                merchant_uid: merchantUid,
                name: `${selectedItems[0].productName} ${
                  selectedItems.length > 1
                    ? `외 ${selectedItems.length - 1}건`
                    : ""
                }`,
                amount: totalAmount,
                buyer_email: user.email,
                buyer_name: user.displayName || "구매자",
              },
              async function (rsp) {
                if (rsp.success) {
                  try {
                    // 주문 정보 저장
                    const orderRef = firebase
                      .database()
                      .ref("orders/" + user.uid);
                    const cartRef = firebase
                      .database()
                      .ref("carts/" + user.uid);
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
                        address: address, // 주소 저장
                        phone: phoneNumber, // 전화번호 저장
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
                    window.location.href = "../index.html";
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
        });
      } else {
        orderSummaryContainer.innerHTML = "<p>장바구니가 비어 있습니다.</p>";
        const orderTotalContainer = document.querySelector(".order-total");
        orderTotalContainer.innerHTML = ""; // 초기화

        const totalDiv = document.createElement("h3");
        totalDiv.innerHTML = `총 결제 금액: <span id="total-price">₩0</span>`;
        orderTotalContainer.appendChild(totalDiv);
      }
    });
  } else {
    console.log("사용자가 로그인되지 않았습니다.");
  }
});

// 지도를 표시할 div
var mapContainer = document.getElementById("map");

// 지도의 중심좌표와 확대 레벨 설정
var mapOption = {
  center: new daum.maps.LatLng(37.537187, 127.005476),
  level: 5,
};

// 지도를 생성
var map = new daum.maps.Map(mapContainer, mapOption);

// 주소-좌표 변환 객체를 생성
var geocoder = new daum.maps.services.Geocoder();

// 마커를 미리 생성
var marker = new daum.maps.Marker({
  position: new daum.maps.LatLng(37.537187, 127.005476),
  map: map,
});

// 주소 검색 기능
function sample5_execDaumPostcode() {
  new daum.Postcode({
    oncomplete: function (data) {
      const addr = data.address; // 최종 주소 변수

      // 주소 정보를 해당 필드에 넣는다.
      document.getElementById("sample5_address").value = addr;

      // 주소로 상세 정보를 검색
      geocoder.addressSearch(addr, function (results, status) {
        if (status === daum.maps.services.Status.OK) {
          const result = results[0]; // 첫번째 결과의 값을 활용

          // 해당 주소에 대한 좌표를 받아서
          const coords = new daum.maps.LatLng(result.y, result.x);
          // 지도를 보여준다.
          document.getElementById("map").style.display = "block";
          map.relayout();
          // 지도 중심을 변경한다.
          map.setCenter(coords);
          // 마커를 결과값으로 받은 위치로 옮긴다.
          marker.setPosition(coords);
        }
      });
    },
  }).open();
}
