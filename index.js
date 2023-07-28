var json_node = "https://api.binance.com/api/v1/ticker/allPrices";
var coinsPriceList = {};

var addBtn = document.querySelector("#add");
var coinNameInput = document.querySelector("#coinName");
var targetPriceInput = document.querySelector("#targetPrice");
var tbody = document.querySelector("#alert-list");
var alertSoundBtn = document.querySelector("#pause-alert");

var isAlertBtnOn = true;
var audio = new Audio("m8.mp3");


async function getPrices(){
    const jsonData = await fetch(json_node);
    const xhrData = await jsonData.json();

    updateInstruments(xhrData);
    checkCondition();

    setTimeout(() => {
        getPrices();
    }, 10000);
}

function updateInstruments(xhrData){

    const latestPrices = {};

    xhrData.forEach(({ symbol, price }) => {
        latestPrices[symbol] = parseFloat(price)
    });

    coinsPriceList = latestPrices;
}

function checkCondition(){
    const alerts = loadAlerts();

    console.log("checkCondition", alerts);

    for(var i = 0; i < alerts.length; i++){
        var currentAlert = alerts[i];
        var currentPrice = parseFloat(coinsPriceList[currentAlert.coinName]);

        if(currentAlert.direction === "up" && currentPrice >= currentAlert.targetPrice){
            addNotification({
                id: currentAlert.id,
                coinName: currentAlert.coinName, 
                targetPrice: currentAlert.targetPrice, 
                direction: currentAlert.direction, 
                priceWhenAdd: currentAlert.priceWhenAdd
            });

            removeAlert(currentAlert.id);
        }else if(currentAlert.direction === "down" && currentPrice <= currentAlert.targetPrice){
            addNotification({
                id: currentAlert.id,
                coinName: currentAlert.coinName, 
                targetPrice: currentAlert.targetPrice, 
                direction: currentAlert.direction, 
                priceWhenAdd: currentAlert.priceWhenAdd
            });

            removeAlert(currentAlert.id);
        }
    }

    updateTable();
    showNotifications();
}

function showNotifications(){
    const nots = loadNotification();

    var notiHtml = ``;

    for(var i = 0; i < nots.length; i++){
        var notification = nots[i];

        console.log(notification);

        var message = `${notification.coinName} has come ${notification.direction} to the targat price of
                        ${notification.targetPrice}.                
        `;

        notiHtml += `
            <div id="${notification.id}">
                <p>${message}</p>
                <button onclick="removeNotification('${notification.id}')">Remove</button>
            </div>
        `;
    }

    document.querySelector(".notification").innerHTML = notiHtml;

    if(nots.length > 0){
        playSound();
    }else{
        stopSound();
    }
}

function addNotification(notification){
    console.log("addNotification", notification);
    const nots = loadNotification();
    nots.push(notification);
    saveNotification(nots);
}

function removeNotification(id){
    const nots = loadNotification();

    const newNots = nots.filter((alert) => {
        return alert.id !== id;
    });

    saveNotification(newNots);

    showNotifications();
}

function addAlert(alert){
    const alerts = loadAlerts();
    alerts.push(alert);
    saveAlerts(alerts);
    updateTable();
}

function removeAlert(id){
    const alerts = loadAlerts();
    const newAlerts = alerts.filter((alert) => {
        return alert.id !== id;
    });

    saveAlerts(newAlerts);

    updateTable();
}

function updateTable(){
    const alerts = loadAlerts();

    var alertHtml = "";

    for(var i = 0; i < alerts.length; i++){
        var curentAlert = alerts[i];

        alertHtml += `
                <tr id="${curentAlert.id}">
                    <td>${curentAlert.coinName}</td>
                    <td>${coinsPriceList[curentAlert.coinName]}</td>
                    <td>${curentAlert.targetPrice}</td>
                    <td>${curentAlert.direction.toUpperCase()}</td>
                    <td><button style="background-color:#ed728a" onclick="removeAlert('${curentAlert.id}')">Remove</button></td>
                </tr>
        `;
    }

    tbody.innerHTML = alertHtml;
}

function findDirection(){
    var radioBtns = document.getElementsByName("direction");
    var selectedDirection = "";

    for(var i = 0; i < radioBtns.length; i++){
        if(radioBtns[i].checked){
            selectedDirection = radioBtns[i].value;
        }
    }

    return selectedDirection;
}

function loadAlerts(){
    const alerts = JSON.parse(localStorage.getItem("alerts"));
    
    if(alerts){
        return alerts;
        
    }else{
        return [];
    }
}

function saveAlerts(alerts){
    localStorage.setItem("alerts", JSON.stringify(alerts));
}

function loadNotification(){
    const nots = JSON.parse(localStorage.getItem("nots"));
    
    if(nots){
        return nots;
        
    }else{
        return [];
    }
}

function saveNotification(alerts){
    localStorage.setItem("nots", JSON.stringify(alerts));
}

function playSound(){
    if(isAlertBtnOn){
        audio.play();
    }else{
        audio.pause();
    }
}

function stopSound(){
    audio.pause();
}

// Add Alert
addBtn.addEventListener("click", () => {
    var coin = coinNameInput.value.toUpperCase();
    var targetPrice = parseFloat(targetPriceInput.value);
    var direction = findDirection();
    var up_down = "";
    var id = "id" + Math.random().toString(16).slice(2);

    if(coin.trim().length === 0){
        return  alert("Please provide the coin name!");
    }

    if(!coinsPriceList[coin]){
        return  alert("Inavlid Coin Name!");
    }

    if(!direction){
        return alert("Please select the direction of the target!");
    }

    if(!targetPrice){
        return alert("Please provide the target price!");
    }

    if(parseFloat(coinsPriceList[coin]) > targetPrice && direction === "down"){
        up_down = "down";
    }else if(parseFloat(coinsPriceList[coin]) < targetPrice && direction === "up"){
        up_down = "up";
    }else{
        return alert("Invalid target price. target price should below the current price for down and above the current price for up");
    }

    addAlert(
        {
            id: id,
            coinName: coin, 
            targetPrice: targetPrice, 
            direction: up_down, 
            priceWhenAdd: parseFloat(coinsPriceList[coin])
        }
    );
});

// Alert sound on off
alertSoundBtn.addEventListener("click", () => {
    if(isAlertBtnOn){
        alertSoundBtn.textContent = "On Alerts"
        isAlertBtnOn = false; 
    }else{
        alertSoundBtn.textContent = "Pause Alerts"
        isAlertBtnOn = true;
        checkCondition();
    }
});


getPrices();
