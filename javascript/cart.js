// IMP 초기화
var IMP = window.IMP;
IMP.init("imp67622846");

document.addEventListener("DOMContentLoaded", function () {
  document.getElementById("total-price").textContent = "₩0";

  firebase.auth().onAuthStateChanged(function (user) {
    if (user) {
      const userId = user.uid;
      const cartRef = firebase.database().ref("carts/" + userId);
      const cartContainer = document.getElementById("cart-items");

      // 장바구니 데이터 가져오기
      cartRef.on("value", (snapshot) => {
        const cartItems = snapshot.val();
        cartContainer.innerHTML = "";

        let totalPrice = 0;

        if (cartItems) {
          Object.keys(cartItems).forEach((key) => {
            const item = cartItems[key];
            const itemTotalPrice = item.productPrice * item.quantity;
            totalPrice += itemTotalPrice;

            // 태그 정보를 HTML로 변환
            const tagsHtml = item.tags 
              ? item.tags.map(tag => `<span class="tag">${tag}</span>`).join('')
              : '';

            // 장바구니 항목 생성
            const cartItemDiv = document.createElement("div");
            cartItemDiv.classList.add("cart-item");
            cartItemDiv.dataset.key = item.productId;
            cartItemDiv.dataset.tags = JSON.stringify(item.tags || []); // 태그 정보 저장
            cartItemDiv.innerHTML = `
                <img src="${item.productImage || "https://via.placeholder.com/100"}" alt="${item.productName}" />
                <div class="item-info">
                    <h3>${item.productName}</h3>
                    <p>${item.productDescription}</p>
                    <p>₩${item.productPrice.toLocaleString()}</p>
                    <div class="item-quantity">
                        <span class="quantity">${item.quantity}개</span>
                    </div>
                   
                </div>
                <button class="remove-item" data-key="${key}">제거</button>
            `;
            cartContainer.appendChild(cartItemDiv);
          });

          document.getElementById("total-price").textContent = 
            `₩${totalPrice.toLocaleString()}`;
        } else {
          cartContainer.innerHTML = "<p>장바구니가 비어 있습니다.</p>";
        }
      });

      cartContainer.addEventListener("click", async function (e) {
        const target = e.target;
        const key = target.dataset.key;

        if (target.classList.contains("remove-item")) {
          const cartItemDiv = target.parentElement;
          const itemQuantity = parseInt(
            cartItemDiv.querySelector(".quantity").textContent,
            10
          );

          try {
            await cartRef.child(key).remove();
            console.log("장바구니 항목 제거 성공:", key);

            const productRef = firebase.database().ref("products/" + key);
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
      });

      // 결제 페이지로 이동할 때 태그 정보 포함
      document
        .getElementById("checkout")
        .addEventListener("click", function () {
          const cartItems = document.querySelectorAll(".cart-item");
          const itemsWithTags = Array.from(cartItems).map(item => {
            return {
              productId: item.dataset.key,
              tags: JSON.parse(item.dataset.tags)
            };
          });
          
          // 세션 스토리지에 태그 정보 저장
          sessionStorage.setItem('cartItemsWithTags', JSON.stringify(itemsWithTags));
          
          window.location.href = "./payment.html";
        });
    } else {
      alert("로그인 해주세요.");
      window.location.href = "./login.html";
    }
  });
});

function updateTotalPrice() {
  let totalPrice = 0;
  const cartItems = document.querySelectorAll(".cart-item");

  cartItems.forEach((cartItemDiv) => {
    const price = parseInt(
      cartItemDiv.querySelector("p").textContent.replace(/[^0-9]/g, ""),
      10
    );
    const quantity = parseInt(
      cartItemDiv.querySelector(".quantity").textContent,
      10
    );
    totalPrice += price * quantity;
  });

  document.getElementById(
    "total-price"
  ).textContent = `₩${totalPrice.toLocaleString()}`;
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