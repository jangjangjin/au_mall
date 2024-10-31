
document
  .getElementById("product-image")
  .addEventListener("change", function (event) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function (e) {
        const img = document.getElementById("image-preview");
        img.src = e.target.result;
        img.style.display = "block";
      };
      reader.readAsDataURL(file);
    }
  });


function convertAndUploadImage(file, callback) {
  const reader = new FileReader();
  reader.onload = function (event) {
    const img = new Image();
    img.onload = function () {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      canvas.toBlob(function (blob) {
        callback(blob);
      }, "image/webp");
    };
    img.src = event.target.result;
  };
  reader.readAsDataURL(file);
}


document
  .getElementById("add-product-form")
  .addEventListener("submit", function (event) {
    event.preventDefault();

    const productName = document.getElementById("product-name").value;
    const productPrice = document.getElementById("product-price").value;
    const productDescription = document.getElementById(
      "product-description"
    ).value;
    const productQuantity = document.getElementById("product-quantity").value;
    const productImage = document.getElementById("product-image").files[0];

    if (productImage) {
      convertAndUploadImage(productImage, function (webpBlob) {
        const storageRef = firebase.storage().ref();
        const imageRef = storageRef.child(
          "product-images/" +
            productImage.name.replace(/\.[^/.]+$/, "") +
            ".webp"
        );

        
        imageRef
          .put(webpBlob)
          .then((snapshot) => {
            snapshot.ref.getDownloadURL().then((downloadURL) => {
              
              const productData = {
                name: productName,
                price: productPrice,
                description: productDescription,
                quantity: productQuantity,
                imageUrl: downloadURL,
              };

              const productId = firebase.database().ref("products").push().key;
              firebase
                .database()
                .ref("products/" + productId)
                .set(productData)
                .then(() => {
                  alert("상품이 추가되었습니다.");
                  document.getElementById("add-product-form").reset();
                  document.getElementById("image-preview").style.display =
                    "none";
                  
                  addProductToList(productId, productData);
                })
                .catch((error) => {
                  console.error("상품 추가 중 오류 발생:", error);
                });
            });
          })
          .catch((error) => {
            console.error("이미지 업로드 중 오류 발생:", error);
          });
      });
    } else {
      alert("상품 이미지를 선택해주세요.");
    }
  });


function addProductToList(productId, productData) {
  const productList = document.querySelector(".product-list ul");
  const listItem = document.createElement("li");
  listItem.setAttribute("data-id", productId);
  listItem.innerHTML = `
        <input type="checkbox" class="select-product">
        <img src="${productData.imageUrl}" alt="${productData.name}" style="width: 150px; height: 150px;">
        <div>
            <strong>${productData.name}</strong>
            <p>${productData.description}</p>
            <p>가격: ${productData.price}원</p>
            <p>수량: ${productData.quantity}개</p>
            <button class="edit-product">수정</button>
            <button class="remove-product">제거</button>
        </div>
    `;
  productList.appendChild(listItem);

  
  listItem
    .querySelector(".remove-product")
    .addEventListener("click", function () {
      removeProduct(productId, productData.imageUrl);
    });

  
  listItem
    .querySelector(".edit-product")
    .addEventListener("click", function () {
      openEditModal(productId, productData);
    });
}


function openEditModal(productId, productData) {
  const modal = document.getElementById("edit-product-modal");
  modal.style.display = "block";

  
  document.getElementById("edit-product-name").value = productData.name;
  document.getElementById("edit-product-price").value = productData.price;
  document.getElementById("edit-product-description").value =
    productData.description;
  document.getElementById("edit-product-quantity").value = productData.quantity;
  document.getElementById("edit-image-preview").src = productData.imageUrl;
  document.getElementById("edit-image-preview").style.display = "block";

  
  document.getElementById("edit-product-form").onsubmit = function (event) {
    event.preventDefault();
    document.getElementById("loading-spinner").style.display = "block"; 
    updateProduct(productId);
  };
}


document.querySelector(".modal .close").addEventListener("click", function () {
  document.getElementById("edit-product-modal").style.display = "none";
  document.getElementById("loading-spinner").style.display = "none"; 
});


function updateProduct(productId) {
  const productName = document.getElementById("edit-product-name").value;
  const productPrice = document.getElementById("edit-product-price").value;
  const productDescription = document.getElementById(
    "edit-product-description"
  ).value;
  const productQuantity = document.getElementById(
    "edit-product-quantity"
  ).value;
  const productImage = document.getElementById("edit-product-image").files[0];

  const productData = {
    name: productName,
    price: productPrice,
    description: productDescription,
    quantity: productQuantity,
  };

  if (productImage) {
    convertAndUploadImage(productImage, function (webpBlob) {
      const storageRef = firebase.storage().ref();
      const imageRef = storageRef.child(
        "product-images/" + productImage.name.replace(/\.[^/.]+$/, "") + ".webp"
      );

      
      imageRef
        .put(webpBlob)
        .then((snapshot) => {
          snapshot.ref.getDownloadURL().then((downloadURL) => {
            productData.imageUrl = downloadURL;
            saveProductData(productId, productData);
          });
        })
        .catch((error) => {
          console.error("이미지 업로드 중 오류 발생:", error);
          document.getElementById("loading-spinner").style.display = "none"; 
        });
    });
  } else {
    saveProductData(productId, productData);
  }
}


function saveProductData(productId, productData) {
  firebase
    .database()
    .ref("products/" + productId)
    .set(productData)
    .then(() => {
      alert("상품이 수정되었습니다.");
      document.getElementById("add-product-form").reset();
      document.getElementById("image-preview").style.display = "none";
      loadProductList();
      document.getElementById("loading-spinner").style.display = "none"; 
      document.getElementById("edit-product-modal").style.display = "none"; 
    })
    .catch((error) => {
      console.error("상품 수정 중 오류 발생:", error);
      document.getElementById("loading-spinner").style.display = "none"; 
    });
}


function removeSelectedProducts() {
  const selectedProducts = document.querySelectorAll(".select-product:checked");
  const promises = [];
  selectedProducts.forEach((checkbox) => {
    const listItem = checkbox.closest("li");
    const productId = listItem.getAttribute("data-id");
    const imageUrl = listItem.querySelector("img").src;
    promises.push(removeProduct(productId, imageUrl));
  });

  Promise.all(promises).then(() => {
    alert("선택된 상품이 제거되었습니다.");
  });
}


function toggleSelectAllProducts() {
  const checkboxes = document.querySelectorAll(".select-product");
  const allChecked = Array.from(checkboxes).every(
    (checkbox) => checkbox.checked
  );
  checkboxes.forEach((checkbox) => {
    checkbox.checked = !allChecked;
  });
}


function loadProductList() {
  const productList = document.querySelector(".product-list ul");
  productList.innerHTML = ""; 

  firebase
    .database()
    .ref("products")
    .once("value", (snapshot) => {
      snapshot.forEach((childSnapshot) => {
        const productId = childSnapshot.key;
        const productData = childSnapshot.val();
        addProductToList(productId, productData);
      });
    });
}


document.addEventListener("DOMContentLoaded", function () {
  loadProductList();
  loadUserList();

  document
    .getElementById("remove-selected-products")
    .addEventListener("click", removeSelectedProducts);
  document
    .getElementById("select-all-products")
    .addEventListener("click", toggleSelectAllProducts);
});


function removeProduct(productId, imageUrl) {
  return firebase
    .database()
    .ref("products/" + productId)
    .remove()
    .then(() => {
      if (imageUrl && isValidFirebaseStorageUrl(imageUrl)) {
        const storageRef = firebase.storage().refFromURL(imageUrl);
        return storageRef.delete().then(() => {
          const listItem = document.querySelector(`li[data-id="${productId}"]`);
          if (listItem) listItem.remove();
        });
      } else {
        const listItem = document.querySelector(`li[data-id="${productId}"]`);
        if (listItem) listItem.remove();
      }
    })
    .catch((error) => {
      console.error("상품 제거 중 오류 발생:", error);
    });
}


function isValidFirebaseStorageUrl(url) {
  const pattern =
    /^https:\/\/firebasestorage\.googleapis\.com\/v0\/b\/[^\/]+\/o\/[^?]+/;
  return pattern.test(url);
}


function removeUser(userId) {
  firebase
    .database()
    .ref("users/" + userId)
    .remove()
    .then(() => {
      const listItem = document.querySelector(`li[data-id="${userId}"]`);
      if (listItem) listItem.remove();
      alert("회원이 제거되었습니다.");
    })
    .catch((error) => {
      console.error("회원 제거 중 오류 발생:", error);
    });
}


function addUserToList(userId, userData) {
  const userList = document.querySelector(".user-list ul");
  const listItem = document.createElement("li");
  listItem.setAttribute("data-id", userId);
  listItem.innerHTML = `
        <div>
            <strong>${userData.username}</strong>
            <p>${userData.email}</p>
            <button class="remove-user">제거</button>
        </div>
    `;
  userList.appendChild(listItem);

  
  listItem.querySelector(".remove-user").addEventListener("click", function () {
    removeUser(userId);
  });
}


function loadUserList() {
  const userList = document.querySelector(".user-list ul");
  userList.innerHTML = ""; 

  firebase
    .database()
    .ref("users")
    .once("value", (snapshot) => {
      snapshot.forEach((childSnapshot) => {
        const userId = childSnapshot.key;
        const userData = childSnapshot.val();
        addUserToList(userId, userData);
      });
    });
}


let csvData = null;

document
  .getElementById("csv-file")
  .addEventListener("change", function (event) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function (e) {
        csvData = e.target.result;
        
        if (csvData.charCodeAt(0) === 0xfeff) {
          csvData = csvData.substr(1);
        }
      };
      reader.readAsText(file, "UTF-8"); 
    }
  });


document.getElementById("upload-csv").addEventListener("click", function () {
  if (csvData) {
    const products = processCSVData(csvData);
    uploadCSVData(products);
    
    document.getElementById("csv-file").value = "";
    csvData = null;
  } else {
    alert("CSV 파일을 선택해주세요.");
  }
});


function processCSVData(csvData) {
  const lines = csvData.split("\n");
  const headers = lines[0].split(",").map((header) => header.trim()); 

  const products = [];
  for (let i = 1; i < lines.length; i++) {
    const data = lines[i].split(",");
    if (data.length === headers.length) {
      const productData = {};
      for (let j = 0; j < headers.length; j++) {
        const key = headers[j];
        const value = data[j].trim(); 
        productData[key] = value;
      }
      
      if (!productData.imageUrl) {
        productData.imageUrl = "https://example.com/default-image.jpg"; 
      }
      products.push(productData);
    }
  }
  return products;
}


function uploadCSVData(products) {
  products.forEach((productData) => {
    const productId = firebase.database().ref("products").push().key;
    firebase
      .database()
      .ref("products/" + productId)
      .set(productData)
      .then(() => {
        console.log("상품이 추가되었습니다:", productData);
        addProductToList(productId, productData);
      })
      .catch((error) => {
        console.error("상품 추가 중 오류 발생:", error);
      });
  });
} 
function formatDate(timestamp) {
  if (!timestamp) return 'N/A';
  
  const date = new Date(timestamp);
  
  
  if (isNaN(date.getTime())) return 'Invalid Date';
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}


firebase.auth().onAuthStateChanged(function (user) {
  if (user) {
    const inquiryRef = firebase.database().ref("inquiries");
    inquiryRef.on("value", (snapshot) => {
      const inquiriesList = document.getElementById("admin-inquiries-list");
      inquiriesList.innerHTML = "";

      if (!snapshot.exists()) {
        inquiriesList.innerHTML = '<p class="no-inquiries">문의 내역이 없습니다.</p>';
        return;
      }

      snapshot.forEach((childSnapshot) => {
        const inquiry = childSnapshot.val();
        const inquiryId = childSnapshot.key;

        
        const status = inquiry.status || 'pending';
        const statusClass = `status-${status.toLowerCase()}`;

        const inquiryElement = document.createElement("div");
        inquiryElement.className = "admin-inquiry-item";
        inquiryElement.innerHTML = `
          <div class="inquiry-header">
              <span class="inquiry-date">작성일: ${formatDate(inquiry.timestamp)}</span>
              <span class="inquiry-status ${statusClass}">${status}</span>
          </div>
          <div class="inquiry-info">
              <p><strong>작성자:</strong> ${inquiry.name}</p>
              <p><strong>이메일:</strong> ${inquiry.email}</p>
              <p><strong>문의내용:</strong> ${inquiry.message}</p>
          </div>
          <div class="answer-section">
              <h4>답변</h4>
              <textarea id="answer-${inquiryId}" class="answer-textarea"
                  ${inquiry.answer ? "disabled" : ""}
              >${inquiry.answer || ""}</textarea>
              ${
                inquiry.answer
                  ? `
                  <p class="answer-info">답변일: ${formatDate(inquiry.answerTimestamp)}</p>
                  <button onclick="editAnswer('${inquiryId}')" class="edit-btn">답변 수정</button>
              `
                  : `
                  <button onclick="submitAnswer('${inquiryId}')" class="submit-btn">답변 등록</button>
              `
              }
          </div>
        `;

        inquiriesList.appendChild(inquiryElement);
      });
    });
  }
});

window.submitAnswer = function (inquiryId) {
  const answerText = document.getElementById(`answer-${inquiryId}`).value.trim();

  if (!answerText) {
    alert("답변을 입력해주세요.");
    return;
  }

  const inquiryRef = firebase.database().ref("inquiries").child(inquiryId);

  inquiryRef.update({
    answer: answerText,
    answerTimestamp: new Date().toISOString(),
    status: "completed"  
  })
  .then(() => {
    alert("답변이 등록되었습니다.");
  })
  .catch((error) => {
    console.error("답변 등록 중 오류 발생:", error);
    alert("답변 등록에 실패했습니다.");
  });
};


window.editAnswer = function (inquiryId) {
  const textarea = document.getElementById(`answer-${inquiryId}`);
  const currentAnswer = textarea.value;

  if (textarea.disabled) {
    
    textarea.disabled = false;
    textarea.focus();
    event.target.textContent = "수정 완료";
  } else {
    
    const newAnswer = textarea.value.trim();

    if (!newAnswer) {
      alert("답변을 입력해주세요.");
      return;
    }

    const inquiryRef = firebase.database().ref("inquiries").child(inquiryId);

    inquiryRef
      .update({
        answer: newAnswer,
        answerTimestamp: new Date().toISOString(),
      })
      .then(() => {
        textarea.disabled = true;
        event.target.textContent = "답변 수정";
        alert("답변이 수정되었습니다.");
      })
      .catch((error) => {
        console.error("답변 수정 중 오류 발생:", error);
        alert("답변 수정에 실패했습니다.");
      });
  }
};
