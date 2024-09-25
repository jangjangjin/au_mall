// 이미지 미리보기 기능
document.getElementById('product-image').addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = document.getElementById('image-preview');
            img.src = e.target.result;
            img.style.display = 'block';
        };
        reader.readAsDataURL(file);
    }
});

// 이미지 변환 및 업로드 함수
function convertAndUploadImage(file, callback) {
    const reader = new FileReader();
    reader.onload = function(event) {
        const img = new Image();
        img.onload = function() {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            canvas.toBlob(function(blob) {
                callback(blob);
            }, 'image/webp');
        };
        img.src = event.target.result;
    };
    reader.readAsDataURL(file);
}

// 상품 추가 폼 제출 이벤트 처리
document.getElementById('add-product-form').addEventListener('submit', function(event) {
    event.preventDefault();

    const productName = document.getElementById('product-name').value;
    const productPrice = document.getElementById('product-price').value;
    const productDescription = document.getElementById('product-description').value;
    const productQuantity = document.getElementById('product-quantity').value;
    const productImage = document.getElementById('product-image').files[0];

    if (productImage) {
        convertAndUploadImage(productImage, function(webpBlob) {
            const storageRef = firebase.storage().ref();
            const imageRef = storageRef.child('product-images/' + productImage.name.replace(/\.[^/.]+$/, "") + '.webp');

            // 이미지 업로드
            imageRef.put(webpBlob).then((snapshot) => {
                snapshot.ref.getDownloadURL().then((downloadURL) => {
                    // 상품 정보를 데이터베이스에 저장
                    const productData = {
                        name: productName,
                        price: productPrice,
                        description: productDescription,
                        quantity: productQuantity,
                        imageUrl: downloadURL
                    };

                    const productId = firebase.database().ref('products').push().key;
                    firebase.database().ref('products/' + productId).set(productData)
                        .then(() => {
                            alert('상품이 추가되었습니다.');
                            document.getElementById('add-product-form').reset();
                            document.getElementById('image-preview').style.display = 'none';
                            // 상품 목록 갱신
                            addProductToList(productId, productData);
                        })
                        .catch((error) => {
                            console.error('상품 추가 중 오류 발생:', error);
                        });
                });
            }).catch((error) => {
                console.error('이미지 업로드 중 오류 발생:', error);
            });
        });
    } else {
        alert('상품 이미지를 선택해주세요.');
    }
});

// 상품 목록에 항목 추가
function addProductToList(productId, productData) {
    const productList = document.querySelector('.product-list ul');
    const listItem = document.createElement('li');
    listItem.setAttribute('data-id', productId);
    listItem.innerHTML = `
        <img src="${productData.imageUrl}" alt="${productData.name}" style="width: 150px; height: 150px;">
        <div>
            <strong>${productData.name}</strong>
            <p>${productData.description}</p>
            <p>가격: ${productData.price}원</p>
            <p>수량: ${productData.quantity}</p>
            <button class="edit-product">수정</button>
            <button class="remove-product">제거</button>
        </div>
    `;
    productList.appendChild(listItem);

    // 제거 버튼 이벤트 추가
    listItem.querySelector('.remove-product').addEventListener('click', function() {
        removeProduct(productId, productData.imageUrl);
    });

    // 수정 버튼 이벤트 추가
    listItem.querySelector('.edit-product').addEventListener('click', function() {
        editProduct(productId, productData);
    });
}

// 상품 제거 함수
function removeProduct(productId, imageUrl) {
    // 데이터베이스에서 상품 제거
    firebase.database().ref('products/' + productId).remove()
        .then(() => {
            // 스토리지에서 이미지 제거
            const storageRef = firebase.storage().refFromURL(imageUrl);
            storageRef.delete()
                .then(() => {
                    alert('상품이 제거되었습니다.');
                    // 화면에서 항목 제거
                    const listItem = document.querySelector(`li[data-id="${productId}"]`);
                    listItem.remove();
                })
                .catch((error) => {
                    console.error('이미지 제거 중 오류 발생:', error);
                });
        })
        .catch((error) => {
            console.error('상품 제거 중 오류 발생:', error);
        });
}

// 상품 수정 함수
function editProduct(productId, productData) {
    // 수정 폼 생성
    const editForm = document.createElement('form');
    editForm.innerHTML = `
        <div>
            <label for="edit-product-name">상품명:</label>
            <input type="text" id="edit-product-name" name="edit-product-name" value="${productData.name}" required>
        </div>
        <div>
            <label for="edit-product-price">가격:</label>
            <input type="number" id="edit-product-price" name="edit-product-price" value="${productData.price}" required>
        </div>
        <div>
            <label for="edit-product-description">설명:</label>
            <textarea id="edit-product-description" name="edit-product-description" required>${productData.description}</textarea>
        </div>
        <div>
            <label for="edit-product-quantity">갯수:</label>
            <input type="number" id="edit-product-quantity" name="edit-product-quantity" value="${productData.quantity}" min="1" required>
        </div>
        <div>
            <label for="edit-product-image">상품 이미지:</label>
            <input type="file" id="edit-product-image" name="edit-product-image" accept="image/*">
        </div>
        <div>
            <img id="edit-image-preview" src="${productData.imageUrl}" alt="이미지 미리보기" style="width: 150px; height: 150px;">
        </div>
        <button type="submit">수정 완료</button>
        <button type="button" id="cancel-edit">취소</button>
    `;

    // 기존 항목 숨기기
    const listItem = document.querySelector(`li[data-id="${productId}"]`);
    listItem.style.display = 'none';
    listItem.parentNode.insertBefore(editForm, listItem);

    // 이미지 미리보기 기능
    document.getElementById('edit-product-image').addEventListener('change', function(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const img = document.getElementById('edit-image-preview');
                img.src = e.target.result;
                img.style.display = 'block';
            };
            reader.readAsDataURL(file);
        }
    });

    // 수정 폼 제출 이벤트 처리
    editForm.addEventListener('submit', function(event) {
        event.preventDefault();

        const updatedName = document.getElementById('edit-product-name').value;
        const updatedPrice = document.getElementById('edit-product-price').value;
        const updatedDescription = document.getElementById('edit-product-description').value;
        const updatedQuantity = document.getElementById('edit-product-quantity').value;
        const updatedImage = document.getElementById('edit-product-image').files[0];

        if (updatedImage) {
            convertAndUploadImage(updatedImage, function(webpBlob) {
                const storageRef = firebase.storage().ref();
                const imageRef = storageRef.child('product-images/' + updatedImage.name.replace(/\.[^/.]+$/, "") + '.webp');

                // 이미지 업로드
                imageRef.put(webpBlob).then((snapshot) => {
                    snapshot.ref.getDownloadURL().then((downloadURL) => {
                        // 상품 정보 업데이트
                        const updatedProductData = {
                            name: updatedName,
                            price: updatedPrice,
                            description: updatedDescription,
                            quantity: updatedQuantity,
                            imageUrl: downloadURL
                        };

                        firebase.database().ref('products/' + productId).set(updatedProductData)
                            .then(() => {
                                alert('상품이 수정되었습니다.');
                                editForm.remove();
                                listItem.style.display = 'block';
                                listItem.innerHTML = `
                                    <img src="${updatedProductData.imageUrl}" alt="${updatedProductData.name}" style="width: 150px; height: 150px;">
                                    <div>
                                        <strong>${updatedProductData.name}</strong>
                                        <p>${updatedProductData.description}</p>
                                        <p>가격: ${updatedProductData.price}원</p>
                                        <p>수량: ${updatedProductData.quantity}</p>
                                        <button class="edit-product">수정</button>
                                        <button class="remove-product">제거</button>
                                    </div>
                                `;
                                // 제거 및 수정 버튼 이벤트 다시 추가
                                listItem.querySelector('.remove-product').addEventListener('click', function() {
                                    removeProduct(productId, updatedProductData.imageUrl);
                                });
                                listItem.querySelector('.edit-product').addEventListener('click', function() {
                                    editProduct(productId, updatedProductData);
                                });
                            })
                            .catch((error) => {
                                console.error('상품 수정 중 오류 발생:', error);
                            });
                    });
                }).catch((error) => {
                    console.error('이미지 업로드 중 오류 발생:', error);
                });
            });
        } else {
            // 이미지 변경 없이 상품 정보 업데이트
            const updatedProductData = {
                name: updatedName,
                price: updatedPrice,
                description: updatedDescription,
                quantity: updatedQuantity,
                imageUrl: productData.imageUrl
            };

            firebase.database().ref('products/' + productId).set(updatedProductData)
                .then(() => {
                    alert('상품이 수정되었습니다.');
                    editForm.remove();
                    listItem.style.display = 'block';
                    listItem.innerHTML = `
                        <img src="${updatedProductData.imageUrl}" alt="${updatedProductData.name}" style="width: 150px; height: 150px;">
                        <div>
                            <strong>${updatedProductData.name}</strong>
                            <p>${updatedProductData.description}</p>
                            <p>가격: ${updatedProductData.price}원</p>
                            <p>수량: ${updatedProductData.quantity}</p>
                            <button class="edit-product">수정</button>
                            <button class="remove-product">제거</button>
                        </div>
                    `;
                    // 제거 및 수정 버튼 이벤트 다시 추가
                    listItem.querySelector('.remove-product').addEventListener('click', function() {
                        removeProduct(productId, updatedProductData.imageUrl);
                    });
                    listItem.querySelector('.edit-product').addEventListener('click', function() {
                        editProduct(productId, updatedProductData);
                    });
                })
                .catch((error) => {
                    console.error('상품 수정 중 오류 발생:', error);
                });
        }
    });

    // 수정 취소 버튼 이벤트 처리
    document.getElementById('cancel-edit').addEventListener('click', function() {
        editForm.remove();
        listItem.style.display = 'block';
    });
}

// 초기 상품 목록 로드
function loadProductList() {
    const productList = document.querySelector('.product-list ul');
    productList.innerHTML = ''; // 기존 목록 초기화

    firebase.database().ref('products').once('value', (snapshot) => {
        snapshot.forEach((childSnapshot) => {
            const productId = childSnapshot.key;
            const productData = childSnapshot.val();
            addProductToList(productId, productData);
        });
    });
}

// 초기 로드 시 상품 목록 불러오기
document.addEventListener('DOMContentLoaded', function() {
    loadProductList();
});