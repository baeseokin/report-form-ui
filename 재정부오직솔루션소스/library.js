function daysInMonth(mon, year) {
	var days = 31;
	if(mon == 3 || mon == 5 || mon == 8 || mon == 10) {
		days = 30;
	}
	if(mon == 1 && (year % 4) != Math.floor(year / 4)) {
		days = 28;
	}
	if(mon == 1 && (year % 4) == Math.floor(year / 4)) {
		days = 29;
	}
	return days;
}

//전표 비우기
function formClear() {
	start_date = $('#start_date').val();
	end_date = $('#end_date').val();

	orderName = '';
	//일반전표쪽
	$("#searchForm input[type=hidden]").val('');
	$("#searchForm :text").val('');
	//헌금전표쪽
	$("#searchValue input[type=hidden]").val("")
	$("#searchValue :text").val("");

	$('#start_date').val(start_date);
	$('#end_date').val(end_date);

	document.getElementById('sc_billType').options[0].selected = true;
}

//모두 체크
function checkAll() {
	var check = $('#checkAll').is(":checked");

	if (check) {
		$('#innerTable input').prop('checked', 'checked');
		$('#innerTable tr').removeClass('selectSel');
	} else {
		$('#innerTable input').prop('checked', false);
		$('#innerTable tr').addClass('selectSel');
	}

	changeView();
	tab1Show();

	if (typeof (checkModifyMode) != 'undefined') {
		checkModifyMode();
	}


}

//모두 체크
function temp_checkAll() {
	var check = $('#temp_checkAll').is(":checked");

	if(check) {
		$('#innerTable2 input').prop('checked','checked');
		$('#innerTable2 tr').removeClass('selectSel');
	}else{
		$('#innerTable2 input').prop('checked',false);
		$('#innerTable2 tr').addClass('selectSel');
	}

}

function chkDate(obj) {
	var nextAcntYear = parseInt(nAcntYear);
	nextAcntYear++;
	var year = obj.value.substr(0, 4);
	var mon = obj.value.substr(4, 2);
	var day = obj.value.substr(6, 2);
	var days = daysInMonth(parseInt(mon) - 1, parseInt(year));
	var sD = new Date(parseInt(nAcntYear), parseInt(nAcntMonth) - 1, 1, 0, 0, 0, 1);
	var eD = new Date(parseInt(nextAcntYear), parseInt(nAcntMonth) - 1, 1, 0, 0, 0, 1);
	var thisDate = new Date(parseInt(year), mon - 1, parseInt(day), 0, 0, 0, 1);

	if(chkNum(obj) == false) {
		obj.focus();
		return false;
	}

	if(parseInt(obj.value.length) > 0 && parseInt(obj.value.length) != 8) {
		sAlert("날짜 형식이 맞지 않습니다.");
		obj.value = '';
		obj.focus();
		return false;
	}

	if(thisDate.getTime() < sD.getTime() || thisDate.getTime() >= eD.getTime()) {
		sAlert("해당 회계연도가 아닙니다.");
		obj.value = '';
		obj.focus();
		return false;
	}
	if(parseInt(mon) < 0 || parseInt(mon) > 12) {
		sAlert("월 형식이 맞지 않습니다.");
		obj.value = '';
		obj.focus();
		return false;
	}
	if(parseInt(day) < 0 || parseInt(day) > days) {
		sAlert("일 형식이 맞지 않습니다.");
		obj.value = '';
		obj.focus();
		return false;
	}

}

function chkNum(obj) {
	var chkflag = true;
	for(var i = 0; i < obj.value.length; i++) {
		c = obj.value.charAt(i);
		if(!(c >= '0' && c <= '9')) {
			sAlert("숫자만 입력가능합니다");
			obj.value = "";
			chkflag = false;
			break;
		}
	}
	return chkflag;
}

function chkSDate(obj) {
	if(chkDate(obj) == false) {
		return false; //2012-03-27 김지연  return; 이었었음
	}
	$("#endDate").get(0).value = obj.value;
}

function numFormat(obj) {// 금액 단위 3자리단위로 콤마 찍기.
	if(chkNumFormat(obj) == false) {// 숫자인지 여부 먼저 검사.
		return false;
	}
	var string = obj.value.split(",").join("");
	var factor = string.length % 3;
	var value = string.substring(0, factor);
	for(var i = 0; i < (string.length - factor) / 3; i++) {
		if((factor == 0) && (i == 0)) {
			value += string.substring(factor + (3 * i), factor + 3 + (3 * i));
		} else {
			if(string.substring(factor + (3 * i) - 1, factor + (3 * i)) != '-') {
				value += ',';
			}
			value += string.substring(factor + (3 * i), factor + 3 + (3 * i));
		}
	}
	obj.value = value;
	return true;
}

function chkNumFormat(obj) {
	obj.value = obj.value.split(",").join("");
	if(chkNum(obj) == false) {
		return false;
	}
	return true;
}

function getTimestamp(year, month, date){
	var dateObj = new Date(year, month-1, date);
	return Math.floor(dateObj.getTime()/1000);
}

var alertFlag = false;
// sAlert이 표시중인지체크

function sAlertOut() {
	$('.sAlert').fadeOut("slow");
	alertFlag = false;
}

function sAlert(msg) {// 2초동안 경고창 보여줌.
	var obj = $('.sAlert');
	$(".sAlert").css("background-color","#3a6db9");
	obj.removeClass('manual');
	obj.addClass('alert');
	obj.html(msg);
	obj.show();
	alertFlag = true;
	setTimeout("sAlertOut()", 1000);
}
function sAlertRed(msg){
	var obj = $('.sAlert');
	$(".sAlert").css("background-color","#AC2C38");
	obj.removeClass('manual');
	obj.addClass('alert');
	obj.html(msg);
	obj.show();
	alertFlag = true;
	setTimeout("sAlertOut()", 1000);
}

function manual(msg) {
	if(!alertFlag) {
		if(tabMenu==1){
			var obj = $('#manual');
			obj.removeClass('alert');
			obj.addClass('manual');
			obj.html(msg);
			obj.show();
		} else {
			var obj = $('#sc_manual');
			obj.removeClass('alert');
			obj.addClass('manual');
			obj.html(msg);
			obj.show();
		}
	}
}


//분류가 입력 안되었을 때 input box를 초기화 함.
function temp_inputOff() {

/*	if(page_option != 1){
		$('#inputValue input').each(function() {
			if(this.id != 'date') {
				$(this).addClass('disabled');
				$(this).attr('disabled', true);
				$(this).val("");
			}
		});

		$('#inputValue2 input').each(function() {
				$(this).addClass('disabled');
				$(this).attr('disabled', true);
				$(this).val("");
		});

		$('#etc').each(function() {
				$(this).addClass('disabled');
				$(this).attr('disabled', true);
				$(this).val("");
		});
	}*/
}

function temp_inputOn() {

/*	if(page_option !=1){
		$('#inputValue input').each(function() {
			if(this.id != 'billText' && this.id != 'date') {
				$(this).removeClass('disabled');
				$(this).removeAttr('disabled');
			}
		});

		$('#inputValue2 input').each(function() {
				$(this).removeClass('disabled');
				$(this).removeAttr('disabled');
		});

		$('#etc').each(function() {
				$(this).removeClass('disabled');
				$(this).removeAttr('disabled');
		});
}*/
/*	no = $('#billType').val();
	if(no==1 || no==2){ // 현금일때는 계좌를 막음. 2012-08-17
		$('#bankID').val("");
		$("#bankName").val("");
		$("#bankName").addClass("disabled");
		$("#bankName").attr("disabled", true);
		$("#bankName").removeAttr("tabMoveIndex");
		$("#check_bankName").attr('checked', false);
		$("#check_bankName").attr("disabled", true);
		$("#check_bankName").addClass("disabled");
		focusMove.resetFocusInput("#contentForm", 1000);
	}else if(no==5 || no==6){ // 계좌일땐 무조건 입력
		$('#bankID').val("");
		$("#bankName").val("");
		$("#bankName").removeClass('disabled');
		$("#bankName").removeAttr('disabled');
		$("#bankName").attr("tabMoveIndex",1000);
		$("#check_bankName").attr('checked', true);
		$("#check_bankName").attr("disabled", true);
		$("#check_bankName").removeClass('disabled');
		focusMove.resetFocusInput("#contentForm", 1000);
	}else{
		$('#bankID').val("");
		$("#bankName").val("");
		$("#bankName").removeClass('disabled');
		$("#bankName").removeAttr('disabled');
		$("#check_bankName").attr("disabled", false);
		$("#check_bankName").removeClass('disabled');
	}*/
}


// 분류가 입력 안되었을 때 input box를 초기화 함.
function inputOff() {


	if(page_option == 2){
		$('#inputValue input').each(function () {
			var $this = $(this);
			var id = $this.attr('id');
			if (id != 'billText' && id != 'date' && id != 'autoMoney' && id != 'reservationText') {
				$this.addClass('disabled')
					.prop('disabled', true)
					.val("");
			}
		});

		$('#inputValue2 input').addClass('disabled')
			.prop('disabled', true)
			.val("");

		$('#etc').addClass('disabled')
			.prop('disabled', true)
			.val("");
	}
}

function inputOn() {
	// console.dir(page_option);


	try {
		if(page_option ==2){
			$('#inputValue input').each(function() {
				var $this = $(this);
				if(this.id != 'billText' && this.id != 'date') {
					$this.removeClass('disabled');
					$this.removeAttr('disabled');
				}
			});

			$('#inputValue2 input').each(function() {
				var $this = $(this);
				$this.removeClass('disabled');
				$this.removeAttr('disabled');
			});

			$('#etc').each(function() {
				var $this = $(this);
				$this.removeClass('disabled');
				$this.removeAttr('disabled');
			});
		}
	} catch (e) {
		console.log(e);
	}

/*	no = $('#billType').val();
	if(no==1 || no==2){ // 현금일때는 계좌를 막음. 2012-08-17
		$('#bankID').val("");
		$("#bankName").val("");
		$("#bankName").addClass("disabled");
		$("#bankName").attr("disabled", true);
		$("#bankName").removeAttr("tabMoveIndex");
		$("#check_bankName").attr('checked', false);
		$("#check_bankName").attr("disabled", true);
		$("#check_bankName").addClass("disabled");
		focusMove.resetFocusInput("#contentForm", 1000);
	}else if(no==5 || no==6){ // 계좌일땐 무조건 입력
		$('#bankID').val("");
		$("#bankName").val("");
		$("#bankName").removeClass('disabled');
		$("#bankName").removeAttr('disabled');
		$("#bankName").attr("tabMoveIndex",1000);
		$("#check_bankName").attr('checked', true);
		$("#check_bankName").attr("disabled", true);
		$("#check_bankName").removeClass('disabled');
		focusMove.resetFocusInput("#contentForm", 1000);
	}else{
		$('#bankID').val("");
		$("#bankName").val("");
		$("#bankName").removeClass('disabled');
		$("#bankName").removeAttr('disabled');
		$("#check_bankName").attr("disabled", false);
		$("#check_bankName").removeClass('disabled');
	}*/
}

function endInput(){
	var billType = $("#billType").val() * 1;
	var mode = $("#searchForm").attr('bill');
	$("#inputCheckBox").find('input:checkbox').each(function() {
		var id = this.id.split("check_").join("");

		// console.dir(mode);
		if ([3, 4, 73, 74, 83, 84].indexOf(billType) > -1) {
			$("#acntName").val('');
			$("#acntCodeTemp").val('');
			var tempAmount = $("#amount").val();
			var tempAmount2 = $("#amount2").val();
			// console.dir(tempAmount);
			// console.dir(tempAmount2);
		}
		if (mode == 'bill') {
			$("#amount").val('');
			$("#amount2").val('');
		}


		if(inputSeqCheck.seqIndexValue[id]==1){
			/*$("#"+id).val(''); 2013.0925 임시주석(원천침례교회요구사항)*/
			if(mode!='bill' && churchCode == 1223){
                $("#" + id).val('');
			}
			if(mode=='bill'){
				if(id != "bankName" && id != "bankID" ) {
					$("#"+id).val('');
				}
			}
			if(id=="uName1") {
				$("#uName1").val('');
				$("#uName2").val('');
				$("#pid").val('');
				$("#tid").val('');
				$("#memType").val('');
				$('#name1Tag').attr('class', 'memType' + 0);
				$("#rrn_id").val('');
			}
			if (churchCode == 3241 || churchCode == 5814){
				$("#sumName").val('');
				$("#amount").val('');
			}
		}

		if ([3, 4, 73, 74, 83, 84].indexOf(billType) > -1) {
			$("#amount").val(tempAmount);
			$("#amount2").val(tempAmount2);
		}
	});
	$('#selectBox').hide();
}

function getAccountSum(){ //현재입력중인계정의합을구하는함수
	if(menuName!="donation"){
		return;
	}
	var accountSum = 0;
	var dateSum = 0;
	$('#innerTable tr').each(function(){
        const $this = $(this);
        // var bankType = $(this.childNodes[4].childNodes[0]).attr('bankType');
        var bankType = $this.data('bankType');

		//입력중인 계정 합계
        var listCode = $this.data('accountCode');
        // var listCode = $this.find('.acntNameTd>span').attr('class');
		var accountCode = $("#acntCodeTemp").val();

		if(listCode==accountCode && bankType!="외화"){
            // accountSum += Number($this.find(".moneyData").html().split(",").join(""));
            accountSum += Number($this.data('money'));
		}

		//입력중인 날짜 합계
        // var listDate = $this.attr("billDate").split("-").join("");
        var listDate = $this.data('billDateNum');
		var billDate = $("#date").val();

		if(listDate==billDate && bankType!="외화"){
            // dateSum += Number($this.find(".moneyData").html().split(",").join(""));
            dateSum += Number($this.data('money'));
		}
	});
	// Round to 2 decimal places to avoid floating-point precision errors
	accountSum = Math.round(accountSum * 100) / 100;
	dateSum = Math.round(dateSum * 100) / 100;
	
	$("#accountSum").html(number_format(accountSum));
	$("#dateSum").html(number_format(dateSum));
}



$(function(){
	$(".order").click(function(){
        if(isLoading == false) {
            $(".asc").remove();
            $(".desc").remove();

            var str = $(this).attr("orderName");

            if (orderName == (str + " asc")) {
                orderName = str + " desc";
                imgStr = "<img style='width:9px;height:4px;' src='/images/transpixel.gif' class='desc'/>";
            } else if (orderName == (str + " desc")) {
                orderName = "";
                imgStr = "";
            } else {
                orderName = str + " asc";
                imgStr = "<img style='width:9px;height:4px;' src='/images/transpixel.gif' class='asc'/>";
            }
            $(this).append(imgStr);
            toQuery();
        }

    });
});



function _selectView(from){
	if($("#sum").html()==""){
		alert("조회를 해주세요.");
		return;
	}

	if(isIE == true && (getIEVersion() == 6 || getIEVersion() == 7)){
		var browsHeight = (document.compatMode && document.compatMode!="BackCompat")? document.documentElement.clientHeight : document.body.clientHeight;
			// browsHeight = $(parent.document.getElementById('mainf')).height()

        $("#infoWin").css('height',browsHeight);
		$("#info").css('height', browsHeight);
	}

	$("#infoWin").show();
	$("#info").attr("src", "/bill/selectView/SettingForm/"+from);
}


function temp_selectView(from){
	if($("#sum_01").html()==""){
		alert("조회를 해주세요.");
		return;
	}

	if(isIE == true && (getIEVersion() == 6 || getIEVersion() == 7)){
		var browsHeight = (document.compatMode && document.compatMode!="BackCompat")? document.documentElement.clientHeight : document.body.clientHeight;
			// browsHeight = $(parent.document.getElementById('mainf')).height()

        $("#infoWin").css('height',browsHeight);
		$("#info").css('height', browsHeight);
	}

	$("#infoWin").show();
	$("#info").attr("src", "/bill/selectView/SettingForm/"+from);
}


function reservation_category_view(from){
	if(isIE == true && (getIEVersion() == 6 || getIEVersion() == 7)){
		var browsHeight = (document.compatMode && document.compatMode!="BackCompat")? document.documentElement.clientHeight : document.body.clientHeight;
			// browsHeight = $(parent.document.getElementById('mainf')).height()

        $("#infoWin").css('height',browsHeight);
		$("#info").css('height', browsHeight);
	}

	$("#info").css("width", "400px");
	$("#infoWin").show();
	$("#info").attr("src", "/bill/reservation_category_view/SettingForm/"+from);
}


function _closingSelectView(){
	$("#infoWin").hide();
}

function closing_reservation_category_view(){
	$("#infoWin").hide();
	$("#info").css("width", "660px");
}


