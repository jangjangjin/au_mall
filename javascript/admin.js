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

    // 제거 버튼 이벤트 추가
    listItem.querySelector('.remove-product').addEventListener('click', function() {
        removeProduct(productId, productData.imageUrl);
    });

    // 수정 버튼 이벤트 추가
    listItem.querySelector('.edit-product').addEventListener('click', function() {
        openEditModal(productId, productData);
    });
}

// 모달 창 열기 함수
function openEditModal(productId, productData) {
    const modal = document.getElementById('edit-product-modal');
    modal.style.display = 'block';

    // 수정 폼에 기존 데이터 채우기
    document.getElementById('edit-product-name').value = productData.name;
    document.getElementById('edit-product-price').value = productData.price;
    document.getElementById('edit-product-description').value = productData.description;
    document.getElementById('edit-product-quantity').value = productData.quantity;
    document.getElementById('edit-image-preview').src = productData.imageUrl;
    document.getElementById('edit-image-preview').style.display = 'block';

    // 수정 폼 제출 이벤트 처리
    document.getElementById('edit-product-form').onsubmit = function(event) {
        event.preventDefault();
        document.getElementById('loading-spinner').style.display = 'block'; // 로딩 스피너 표시
        updateProduct(productId);
    };
}

// 모달 창 닫기 이벤트 추가
document.querySelector('.modal .close').addEventListener('click', function() {
    document.getElementById('edit-product-modal').style.display = 'none';
    document.getElementById('loading-spinner').style.display = 'none'; // 로딩 스피너 숨기기
});

// 상품 업데이트 함수
function updateProduct(productId) {
    const productName = document.getElementById('edit-product-name').value;
    const productPrice = document.getElementById('edit-product-price').value;
    const productDescription = document.getElementById('edit-product-description').value;
    const productQuantity = document.getElementById('edit-product-quantity').value;
    const productImage = document.getElementById('edit-product-image').files[0];

    const productData = {
        name: productName,
        price: productPrice,
        description: productDescription,
        quantity: productQuantity
    };

    if (productImage) {
        convertAndUploadImage(productImage, function(webpBlob) {
            const storageRef = firebase.storage().ref();
            const imageRef = storageRef.child('product-images/' + productImage.name.replace(/\.[^/.]+$/, "") + '.webp');

            // 이미지 업로드
            imageRef.put(webpBlob).then((snapshot) => {
                snapshot.ref.getDownloadURL().then((downloadURL) => {
                    productData.imageUrl = downloadURL;
                    saveProductData(productId, productData);
                });
            }).catch((error) => {
                console.error('이미지 업로드 중 오류 발생:', error);
                document.getElementById('loading-spinner').style.display = 'none'; // 로딩 스피너 숨기기
            });
        });
    } else {
        saveProductData(productId, productData);
    }
}

// 상품 데이터 저장 함수
function saveProductData(productId, productData) {
    firebase.database().ref('products/' + productId).set(productData)
        .then(() => {
            alert('상품이 수정되었습니다.');
            document.getElementById('add-product-form').reset();
            document.getElementById('image-preview').style.display = 'none';
            loadProductList();
            document.getElementById('loading-spinner').style.display = 'none'; // 로딩 스피너 숨기기
            document.getElementById('edit-product-modal').style.display = 'none'; // 모달 창 닫기
        })
        .catch((error) => {
            console.error('상품 수정 중 오류 발생:', error);
            document.getElementById('loading-spinner').style.display = 'none'; // 로딩 스피너 숨기기
        });
}

// 선택된 상품 제거 함수
function removeSelectedProducts() {
    const selectedProducts = document.querySelectorAll('.select-product:checked');
    const promises = [];
    selectedProducts.forEach(checkbox => {
        const listItem = checkbox.closest('li');
        const productId = listItem.getAttribute('data-id');
        const imageUrl = listItem.querySelector('img').src;
        promises.push(removeProduct(productId, imageUrl));
    });

    Promise.all(promises).then(() => {
        alert('선택된 상품이 제거되었습니다.');
    });
}

// 전체 선택/해제 함수
function toggleSelectAllProducts() {
    const checkboxes = document.querySelectorAll('.select-product');
    const allChecked = Array.from(checkboxes).every(checkbox => checkbox.checked);
    checkboxes.forEach(checkbox => {
        checkbox.checked = !allChecked;
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

// 초기 로드 시 이벤트 리스너 추가
document.addEventListener('DOMContentLoaded', function() {
    loadProductList();
    loadUserList();

    document.getElementById('remove-selected-products').addEventListener('click', removeSelectedProducts);
    document.getElementById('select-all-products').addEventListener('click', toggleSelectAllProducts);
});

// 상품 제거 함수
function removeProduct(productId, imageUrl) {
    return firebase.database().ref('products/' + productId).remove()
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
            console.error('상품 제거 중 오류 발생:', error);
        });
}

// Firebase Storage URL 유효성 검사 함수
function isValidFirebaseStorageUrl(url) {
    const pattern = /^https:\/\/firebasestorage\.googleapis\.com\/v0\/b\/[^\/]+\/o\/[^?]+/;
    return pattern.test(url);
}

// 초기 회원 목록 로드
function loadUserList() {
    const userList = document.querySelector('.user-list ul');
    userList.innerHTML = ''; // 기존 목록 초기화

    firebase.database().ref('users').once('value', (snapshot) => {
        snapshot.forEach((childSnapshot) => {
            const userId = childSnapshot.key;
            const userData = childSnapshot.val();
            addUserToList(userId, userData);
        });
    });
}

// CSV 파일 업로드 이벤트 처리
let csvData = null;

document.getElementById('csv-file').addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            csvData = e.target.result;
            // BOM 제거
            if (csvData.charCodeAt(0) === 0xFEFF) {
                csvData = csvData.substr(1);
            }
        };
        reader.readAsText(file, 'UTF-8'); // UTF-8 인코딩 지정
    }
});

// CSV 데이터 저장 버튼 이벤트 추가
document.getElementById('upload-csv').addEventListener('click', function() {
    if (csvData) {
        const products = processCSVData(csvData);
        uploadCSVData(products);
        // 파일 입력 필드 초기화
        document.getElementById('csv-file').value = '';
        csvData = null;
    } else {
        alert('CSV 파일을 선택해주세요.');
    }
});

// CSV 데이터 처리 함수
function processCSVData(csvData) {
    const lines = csvData.split('\n');
    const headers = lines[0].split(',').map(header => header.trim()); // 키 값에서 공백 제거

    const products = [];
    for (let i = 1; i < lines.length; i++) {
        const data = lines[i].split(',');
        if (data.length === headers.length) {
            const productData = {};
            for (let j = 0; j < headers.length; j++) {
                const key = headers[j];
                const value = data[j].trim(); // 값에서 공백 제거
                productData[key] = value;
            }
            // 기본 이미지 URL 설정
            if (!productData.imageUrl) {
                productData.imageUrl = 'https://example.com/default-image.jpg'; // 기본 이미지 URL
            }
            products.push(productData);
        }
    }
    return products;
}

// CSV 데이터 Firebase에 업로드 함수
function uploadCSVData(products) {
    products.forEach(productData => {
        const productId = firebase.database().ref('products').push().key;
        firebase.database().ref('products/' + productId).set(productData)
            .then(() => {
                console.log('상품이 추가되었습니다:', productData);
                addProductToList(productId, productData);
            })
            .catch((error) => {
                console.error('상품 추가 중 오류 발생:', error);
            });
    });
}