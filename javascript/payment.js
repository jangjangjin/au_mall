// IMP 초기화
var IMP = window.IMP;
IMP.init("imp67622846");

firebase.auth().onAuthStateChanged(function (user) {
  if (user) {
    const userId = user.uid;
    const cartRef = firebase.database().ref("carts/" + userId);
    const orderSummaryContainer = document.querySelector(".order-summary");
    let totalPrice = 0;
    let selectedItems = [];

    // 장바구니에서 전달된 태그 정보 가져오기
    const cartItemsWithTags = JSON.parse(sessionStorage.getItem('cartItemsWithTags') || '[]');
    
    cartRef.on("value", (snapshot) => {
      const cartItems = snapshot.val();
      orderSummaryContainer.innerHTML = `<h3>주문한 상품</h3>`;
      selectedItems = [];

      if (cartItems) {
        Object.keys(cartItems).forEach((key) => {
          const item = cartItems[key];
          const itemTotalPrice = item.productPrice * item.quantity;
          totalPrice += itemTotalPrice;

          // 해당 상품의 태그 정보 찾기
          const itemTags = cartItemsWithTags.find(it => it.productId === key)?.tags || [];
          
          // 태그를 구조화된 형식으로 변환 (0-태그1, 1-태그2 형식)
          const structuredTags = itemTags.map((tag, index) => `${tag}`);

          selectedItems.push({
            productId: key,
            productName: item.productName,
            quantity: item.quantity,
            productPrice: item.productPrice,
            tags: structuredTags // 구조화된 태그 저장
          });

          const orderItemDiv = document.createElement("div");
          orderItemDiv.classList.add("order-item");
          orderItemDiv.innerHTML = `
            <img src="${item.productImage || "https://via.placeholder.com/100"}" alt="상품 이미지" />
            <div class="item-info">
              <h4>${item.productName}</h4>
              <p>${item.productDescription}</p>
              <p>₩${item.productPrice.toLocaleString()}</p>
              <p>수량: ${item.quantity}개</p>
            </div>
          `;
          orderSummaryContainer.appendChild(orderItemDiv);
        });

        const orderTotalContainer = document.querySelector(".order-total");
        orderTotalContainer.innerHTML = "";

        const totalDiv = document.createElement("h3");
        totalDiv.innerHTML = `총 결제 금액: <span id="total-price">₩${totalPrice.toLocaleString()}</span>`;
        orderTotalContainer.appendChild(totalDiv);

        const placeOrderButton = document.createElement("button");
        placeOrderButton.id = "place-order";
        placeOrderButton.innerHTML = "결제하기";
        orderTotalContainer.appendChild(placeOrderButton);

        placeOrderButton.addEventListener("click", function () {
          if (!user) {
            alert("로그인이 필요합니다!");
            window.location.href = "./login.html";
            return;
          }

          const address = document.getElementById("sample5_address").value +
                         " " + document.getElementById("detailed-address").value;
          const phoneNumber = document.getElementById("phone").value;

          const now = new Date();
          const merchantUid = `IMP${now.getHours()}${now.getMinutes()}${now.getSeconds()}${now.getMilliseconds()}`;

          const totalAmount = totalPrice;
          if (confirm("선택하신 상품을 구매하시겠습니까?")) {
            IMP.request_pay({
              pg: "kakaopay.TC0ONETIME",
              pay_method: "card",
              merchant_uid: merchantUid,
              name: `${selectedItems[0].productName} ${selectedItems.length > 1 ? `외 ${selectedItems.length - 1}건` : ""}`,
              amount: totalAmount,
              buyer_email: user.email,
              buyer_name: user.displayName || "구매자",
            }, async function (rsp) {
              if (rsp.success) {
                try {
                  const orderRef = firebase.database().ref("orders/" + user.uid);
                  const cartRef = firebase.database().ref("carts/" + user.uid);
                  
                  const orderItems = selectedItems.map((item) => ({
                    productId: item.productId,
                    productName: item.productName,
                    quantity: item.quantity,
                    price: Number(item.productPrice),
                    totalPrice: Number(item.productPrice) * item.quantity,
                    tags: item.tags // 구조화된 태그 정보 저장
                  }));

                  const orderData = {
                    orderId: rsp.merchant_uid,
                    orderDate: new Date().toISOString(),
                    paymentId: rsp.imp_uid,
                    totalAmount: rsp.paid_amount,
                    buyer: {
                      name: user.displayName || "구매자",
                      email: user.email,
                      uid: user.uid,
                      address: address,
                      phone: phoneNumber,
                    },
                    items: orderItems,
                    mainProductName: `${selectedItems[0].productName} ${
                      selectedItems.length > 1 ? `외 ${selectedItems.length - 1}건` : ""
                    }`,
                    status: "paid",
                    payment: {
                      method: rsp.pay_method,
                      pgProvider: rsp.pg_provider,
                      pgTid: rsp.pg_tid,
                      receiptUrl: rsp.receipt_url,
                    }
                  };

                  await firebase.database().ref().update({
                    [`orders/${user.uid}/${rsp.merchant_uid}`]: orderData,
                  });

                  for (const item of selectedItems) {
                    await cartRef.child(item.productId).remove();

                    const productRef = firebase.database().ref("products/" + item.productId);
                    await productRef.transaction((product) => {
                      if (product) {
                        product.quantity -= item.quantity;
                      }
                      return product;
                    });
                  }

                  // 결제 완료 후 세션 스토리지 클리어
                  sessionStorage.removeItem('cartItemsWithTags');
                  
                  alert("결제가 완료되었습니다!");
                  window.location.href = "../index.html";
                } catch (error) {
                  console.error("결제 후 처리 중 오류 발생:", error);
                  alert("결제는 완료되었으나 주문 처리 중 오류가 발생했습니다. 고객센터로 문의해주세요.");
                }
              } else {
                let message = "결제에 실패하였습니다.";
                if (rsp.error_msg) {
                  message += "\n" + rsp.error_msg;
                }
                alert(message);
              }
            });
          }
        });
      } else {
        orderSummaryContainer.innerHTML = "<p>장바구니가 비어 있습니다.</p>";
        const orderTotalContainer = document.querySelector(".order-total");
        orderTotalContainer.innerHTML = "";

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
function onDOMLoaded() {}
fetch("footer.html")
  .then((response) => response.text())
  .then((data) => {
    document.getElementById("footer-container").innerHTML = data;
  })
  .catch((error) =>
    console.error("Footer를 로드하는 중 오류가 발생했습니다:", error)
  );
document.addEventListener("DOMContentLoaded", onDOMLoaded);
