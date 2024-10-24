firebase.auth().onAuthStateChanged(function (user) {
  if (user) {
    const userId = user.uid;
    const cartRef = firebase.database().ref("carts/" + userId);
    const orderSummaryContainer = document.querySelector(".order-summary");
    let totalPrice = 0; // 총 결제 금액 변수 초기화

    cartRef.on("value", (snapshot) => {
      const cartItems = snapshot.val();
      orderSummaryContainer.innerHTML = `<h3>주문한 상품</h3>`; // 초기화

      if (cartItems) {
        Object.keys(cartItems).forEach((key) => {
          const item = cartItems[key];
          const itemTotalPrice = item.productPrice * item.quantity; // 상품 총 가격 계산
          totalPrice += itemTotalPrice; // 총 결제 금액 업데이트

          // 주문한 상품 항목 생성
          const orderItemDiv = document.createElement("div");
          orderItemDiv.classList.add("order-item");
          orderItemDiv.innerHTML = `
                    <img src="${
                      item.productImage || "https://via.placeholder.com/100"
                    }" alt="상품 이미지" />
                    <div class="item-info">
                      <h4>${item.productName}</h4>
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

        placeOrderButton.addEventListener("click", function () {
          alert("주문이 완료되었습니다.");
          // 주문 완료 후 처리할 코드 추가
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
    // 로그인 페이지로 리디렉션하거나 별도의 처리를 추가할 수 있습니다.
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
        // 정상적으로 검색이 완료됐으면
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
        } else {
          alert("주소 검색에 실패했습니다.");
        }
      });
    },
  }).open();
}
