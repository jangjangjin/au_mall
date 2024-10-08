const firebaseConfig = {
    apiKey: "AIzaSyBbcV59d0PLO_c7F6-St_udJfvGcF1WY84",
    authDomain: "aumall-67026.firebaseapp.com",
    databaseURL: "https://aumall-67026-default-rtdb.firebaseio.com",
    projectId: "aumall-67026",
    storageBucket: "aumall-67026.appspot.com",
    messagingSenderId: "901993671866",
    appId: "1:901993671866:web:bd898dab7c2752bbfe6683",
    measurementId: "G-BX8FHPL7CD"
  };
  
// Firebase 초기화
firebase.initializeApp(firebaseConfig);
  
// 로그인 지속성 설정
firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL)
    .then(() => {
      console.log("로그인 지속성 설정 완료");
    })
    .catch((error) => {
      console.error("로그인 지속성 설정 중 오류 발생:", error);
    });
