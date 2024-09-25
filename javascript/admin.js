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
                        imageUrl: downloadURL
                    };

                    const productId = firebase.database().ref('products').push().key;
                    firebase.database().ref('products/' + productId).set(productData)
                        .then(() => {
                            alert('상품이 추가되었습니다.');
                            document.getElementById('add-product-form').reset();
                            document.getElementById('image-preview').style.display = 'none';
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

// 상품 제거 버튼 클릭 이벤트 처리
document.querySelectorAll('.remove-product').forEach(button => {
    button.addEventListener('click', function() {
        alert('상품이 제거되었습니다.');
        // 상품 제거 처리 코드 추가
    });
});

// 회원 제거 버튼 클릭 이벤트 처리
document.querySelectorAll('.remove-user').forEach(button => {
    button.addEventListener('click', function() {
        alert('회원이 제거되었습니다.');
        // 회원 제거 처리 코드 추가
    });
});