var NS4;
var IE4;
var sUserAgent = navigator.userAgent;
var isOpera = sUserAgent.indexOf("Opera") > -1;
var isIE = sUserAgent.indexOf("compatible") > -1 && sUserAgent.indexOf("MSIE") > -1 && !isOpera;

function getIEVersion() {
	var rv = -1;
	if(navigator.appName == 'Microsoft Internet Explorer') {
		var re = new RegExp("MSIE ([0-9]{1,}[\.0-9]{0,})");
		if(re.exec(sUserAgent) != null)
			rv = parseFloat(RegExp.$1);
	}
	return rv;
}

if(isIE) {
	IE4 = true;
	NS4 = false;
} else {
	IE4 = false;
	NS4 = true;
}

var isWin = (navigator.appVersion.indexOf("Win") != -1);


//var billType = 1;

function monthChange(obj) {
	document.getElementById("year").value = obj.getAttribute("year");
	document.getElementById("date").value = "";
}

var shiftOption = true;

function submitCheck() {
	var billText = $("#billText");
	var acntName = $("#acntName");
	var acntCode = $("#acntCodeTemp");
	var bankName = $("#bankName");
	var bank = $('#bankID');
	var name = $("#uName");
	var pID = $("#pid");
	var money =  $("#amount");
	var sumName =  $("#sumName");
	var sub_date =  $("#sub_date");
	var bank_ =  $("#bank");
	var holder =  $("#holder");
	var account_no =  $("#account_no");

	if($(".expend_type").find(".active input").val() != '가지급대체'){
		if(acntCode.val().split(" ").join("") == '' || acntCode.val().split(" ").join("") == 0 || acntName.val().split(" ").join("") == '') {
			$('#acntName').focus();
			return false;
		}
		j = accountListData['data'].length;
		for(i = 0 ; i < j; i++){
			if(accountListData['data'][i]['code']==acntCode.val().split(" ").join("")){
				break;
			}
		}
	}
    if(bank.val() != "0"){
        if((bank.val().split(" ").join("")==''||bankName.val().split(" ").join("")=='' )){
            $("#bankName").focus();
            return false;
        }

        if($(".expend_type").find(".active input").val() != '가지급대체'){
            if(name.val().split(" ").join("")=='' || name.val().split(" ").join("")==0) {
                name.focus();
                return false;
            }
            if(bank_.val().split(" ").join("")=='' || bank_.val().split(" ").join("")==0) {
                bank_.focus();
                return false;
            }
            if(holder.val().split(" ").join("")=='' || holder.val().split(" ").join("")==0) {
                holder.focus();
                return false;
            }
            if(account_no.val().split(" ").join("")=='') {
                account_no.focus();
                return false;
            }
        }
    }
	
	if(money.val().split(" ").join("")=='') {
		money.focus();
		return false;
	}

	if(sumName.val().split(" ").join("")=='' || sumName.val().split(" ").join("")==0) {
		sumName.focus();
		return false;
	}

	// 이름이 입력되어 있으면서 pid 가 비어있을 경우
	//pid가 빈건 무아이디, New는 finMember에 추가
/*	if(name.val().split(" ").join("") != '' && pID.val().split(" ").join("") == 'New') {
		if(confirm(name.val() + "은(는) 새로운 성도입니다. 추가하시겠습니까?")) {
			
		} else {
			name.focus();
			return false;
		}
	}
*/
	return true;
}

function _add(obj){ //이거 참 복잡하구만 2012-04-20
	/*
	var trObj = obj.parentNode.parentNode;
	
	if(obj.checked){
		//$(trObj).addClass('selectSel');
		$('tr[billNo='+$(trObj).attr('billNo')+'][date='+$(trObj).attr('date')+'] :checkbox').attr('checked',true);
		$('tr[billNo='+$(trObj).attr('billNo')+'][date='+$(trObj).attr('date')+']').addClass('selectSel');
	}else{
		//$(trObj).removeClass('selectSel');
		$('tr[billNo='+$(trObj).attr('billNo')+'][date='+$(trObj).attr('date')+'] :checkbox').attr('checked',false);
		$('tr[billNo='+$(trObj).attr('billNo')+'][date='+$(trObj).attr('date')+']').removeClass('selectSel');
	}
	selBill(trObj);
	*/
}

function checkBill(obj) {
	if($(obj).prop('checked')=='checked' && $('#checkAll').prop('checked')=='checked'){
		$('#checkAll').prop('checked',false);
	}
}

function clearUnsel(){ //비우기 츄가	
	$('#checkAll').prop('checked', false);
	$('#inputBox input').prop('checked', false);
	
	$('#inputValue input').each(function() {

		if(this.id != 'billType'){
			$(this).val("");
		}
	});
	
	$('#inputValue2 input').each(function() {

		$(this).val("");
	});
	
	$('#etc').each(function() {

		$(this).val("");
	});

	resetName();
	$("#date").val(unselToday);
	$("#fix_account").attr('checked',false);
	$('input:radio[name=expend_type]:input[value='+"지출청구"+']').attr("checked", true);
	
	temp_inputOff();
	
	$('#innerTable tr').each(function(){
		$(this.parentNode.rows).removeClass("selectSel");
	});
	unselBill();
}

function unselBill() {
	var trObj = $('#innerTable tr').get(selectRow);
	if(trObj!=''){
		$(trObj).removeClass("selectedRow");
		selectRow = null;
	}
}

function chkReturn(reData){
	switch(reData.substr(0, 1)){
		case 1 :
				return reData.substr(1,reData.length);
		case 2 :
//			MessageBox.alert("회계년도를 벗어났습니다");
				return reData.substr(1,reData.length);
		case 3 :
//			MessageBox.alert(reData.substr(1,reData.length));
				return "false";
	}
}

var tempBillList;

function selBill(trID) {

	var count_no = $("#innerTable").find("tr").index($("#"+trID.id));
	selectRow = count_no;
	
	var dateTemp = tempBillList.data[count_no];

	var billDate = dateTemp.billDate.split('-').join('');
	var tempmoney = dateTemp.money.split(',').join('');
	billDate = billDate.substr(0,4)+billDate.substr(4,2)+billDate.substr(6,2);
	temp_inputOn();
	$('#date').val(billDate);
	$('#billType').val(2);
	$('#billText').val('출금');
	if(CDVList.billType == 1){
		$('#bank').val(dateTemp.bank);
		$('#holder').val(dateTemp.holder);
		$('#account_no').val(dateTemp.account_no);
	}else{
		$('#bank').val(dateTemp.bank);
		$('#holder').val(dateTemp.holder);
		$('#account_no').val(dateTemp.account_no);
		$('#acntName').val(dateTemp.acntName);
		$('#acntCodeTemp').val(dateTemp.acntCode);
		$("#depth1").val(dateTemp.depth1_code);
		$("#depth2").val(dateTemp.depth2_code);
		$("#depth3").val(dateTemp.depth3_code);
	}
	
	$('#bankName').val(dateTemp.bankName);
	$("#bankID").val(dateTemp.bankID);
	$("#memType").val(dateTemp.memType);
	$('#name1Tag').attr('class','memType'+dateTemp.memType);
	$('#uName').val(dateTemp.name);
	$('#pid').val(dateTemp.pid);
	var money = number_format(tempmoney);
	$("#amount").val(money);
	$('#sumName').val(dateTemp.sumName);


	$("#btn_save").text('항목수정');
	
}

/* selBill 을 tr ID로 호출하다보니 중복 ID가 발생함
 * ID 대신 객체를 전달해 처리하는 selBill2 만듬
 * selBill이 어디 또 쓰이는지 몰라 기존껀 내비둠
*/
function selBill2(trID) {
	var thisObj = $(trID).parent().parent().parent();
	var parentId =$(thisObj.parent().parent().parent()).prop("id"); 
	var count_no = $("#"+parentId + " .innerTable").find("tr").index(thisObj);
	selectRow = count_no;
	var dateTemp = tempBillList.data[count_no];
	var billDate = dateTemp.billDate.split('-').join('');
	var tempmoney = dateTemp.money.split(',').join('');
	billDate = billDate.substr(0,4)+billDate.substr(4,2)+billDate.substr(6,2);
	temp_inputOn();
	
	//복사모드 일때는 기존 입력날짜를 가지고 오지 않고 무조건 오늘 날짜가 들어가 있는 상태로 고정된다.(할렐루야에서 요청)
	if(expend_edit.copy_mode == 1){
		//$('#date').val(billDate);
	}else{
		$('#date').val(billDate);
	}
	
	$('#billType').val(2);
	$('#billText').val('출금');
	if(CDVList.billType == 1){
		$('#bank').val(dateTemp.bank);
		$('#holder').val(dateTemp.holder);
		$('#account_no').val(dateTemp.account_no);
	}else{
		$('#bank').val(dateTemp.account_bank);
		$('#holder').val(dateTemp.account_holder);
		$('#account_no').val(dateTemp.account_no);
		$('#acntName').val(dateTemp.acntName);
		$('#acntCodeTemp').val(dateTemp.acntCode);
		$("#depth1").val(dateTemp.depth1_code);
		$("#depth2").val(dateTemp.depth2_code);
		$("#depth3").val(dateTemp.depth3_code);
	}

	$('#bankName').val(dateTemp.bankName);
	$("#bankID").val(dateTemp.bankID);
	$("#memType").val(dateTemp.memType);
	$('#name1Tag').attr('class','memType'+dateTemp.memType);
	$('#uName').val(dateTemp.name);
	$('#pid').val(dateTemp.pid);
	var money = number_format(tempmoney);
	if($("#btn_save").val() != 3)
	{
		$("#amount").val(money);
		$('#sumName').val(dateTemp.sumName);
	}
	else
	{
        $("#child_account_code").val(dateTemp.acntCode);
        $("#child_account_name").val(dateTemp.acntName);
		$("#amount3").val(money);
		$('#sumName3').val(dateTemp.sumName);
	}
	$("#btn_save").text('항목수정');
	
}


function selBill_pop(obj) {	
	var pop_no = Math.floor(Math.random() * 100) + 1;
	window.open("", "print_win"+pop_no, "width=800px,height=900px,scrollbars=yes,resizable=yes");


	var id = encodeURI(obj.getAttribute('id'));
	var flag = encodeURI(obj.getAttribute('flag'));
	var bank = encodeURI(obj.getAttribute('bank'));
	var account_no =encodeURI(obj.getAttribute('account_no'));
	var holder = encodeURI(obj.getAttribute('holder'));
	
	$("#printExpendForm").attr("action", "/bill/tempBill/temp_expendPrint/"+id+"/"+flag+"/"+bank+"/"+account_no+"/"+holder);
	$("#printExpendForm").attr("target", "print_win"+pop_no);
	$("#temp_expend_code").val();
	$("#printExpendForm").submit();
	
}

//재정청구서 항목 수정
function modifyBill() {
	var write_type = $("#btn_save").val();
	if(selectRow == null) {
	MessageBox.alert("수정할 행을 선택해주세요");
		return false;
	}
	var write_type = $("#btn_save").val();
	var trObj = $("#inputBox"+write_type+" .innerTable").find("tr").eq(selectRow).get(0);
	var data_temp = {};

	if(write_type != 3)
	{
		if(!submitCheck()) {
			return false;
		}
		data_temp.money = $("#amount").val();
		data_temp.sumName = $("#sumName").val();
        data_temp.acntCode = $("#acntCodeTemp").val();
        data_temp.acntName = $("#acntName").val();
	}
	else
	{
		data_temp.money = $("#amount3").val();
		data_temp.sumName = $("#sumName3").val();
        data_temp.acntCode = $("#child_account_code").val();
        data_temp.acntName = $("#child_account_name").val();
	}
	
	data_temp.billDate = $("#date").val();
	data_temp.bankName = $("#bankName").val();
	data_temp.bankID = $("#bankID").val();
	data_temp.account_bank = $("#bank").val();
	data_temp.account_holder = $("#holder").val();
	data_temp.account_no = $("#account_no").val();
	data_temp.type = $('#billType').val();
	data_temp.pid = $("#pid").val();
	data_temp.memType = $("#memType").val();
	data_temp.name = $("#uName").val();
	data_temp.depth1_code =$("#depth1").val();
	data_temp.depth2_code =$("#depth2").val();
	data_temp.depth3_code =$("#depth3").val();

	tempBillList.data[selectRow] = data_temp;
    //console.log(tempBillList);
	changeRow(trObj, data_temp);
	$("#btn_save").text('추가');

	return true;
}

function changeRow(trObj, data) {
	
	var tds = $(trObj.cells).find('span');
	var index = 0;
	billDate =  data.billDate.substr(0,4)+"-"+data.billDate.substr(4,2)+"-"+data.billDate.substr(6,2);
	if($("#btn_save").val() != 3)
	{
		tds[index++].innerHTML = data.bankName;
		tds[index++].innerHTML = data.name;
		tds[index++].innerHTML = data.account_bank;
		tds[index++].innerHTML = data.account_holder;
		tds[index++].innerHTML = data.account_no;
		tds[index++].innerHTML = data.money;
		tds[index++].innerHTML = data.sumName;
	}
	else
	{
        tds[index++].innerHTML = data.acntName;
		tds[index++].innerHTML = data.money;
		tds[index++].innerHTML = data.sumName;
	}
	sumMoney();
	calc_budget();
}


var saving = true;
function _submit(callBackFunc) {
	make_tr(callBackFunc);
}


//승인 하기 전 검사
function _confirm(){
	
	var chk = document.getElementsByName("chk[]");
	var moveList = new Array();
	var flag_list = new Array();

	for(var i = 0; i < chk.length; i++) {
		if(chk[i].checked == true) {
			expend_code = chk[i].getAttribute('expend_code');
			no = chk[i].getAttribute('no');
			move_flag =  chk[i].getAttribute('move_flag');
			moveList.push({
				expend_code : expend_code,
				no : no
			});
			
			flag_list.push(move_flag);
		}
	}
	
	var moveDate = $("#moveDate").val();
	if(moveDate.length != 8){
	MessageBox.alert("이동할 날짜를 정확하게 입력해주세요.");
		return;
	}
	
	var dateStr = moveDate.substr(0,4)+"년 "+moveDate.substr(4,2)+"월 "+moveDate.substr(6,2)+"일";
	if(moveList.length == 0) {
	MessageBox.alert("승인 이동할 청구서를 선택해 주세요.");
		return;
	}
	for(var i = 0, len=flag_list.length; i<len; i++){
		
		if(flag_list[i] == '승인완료' ){
		MessageBox.alert('이미 승인 이동된 청구서가 있습니다. 다시선택해주세요');
			$("#temp_checkAll").attr('checked', false);
			for(i=0;i<chk.length;i++){
				$(chk[i]).attr('checked', false);
			}
			return;
		}
	}
	
	$("#movePop").css('display','block');
}


//대기전표를 승인하여 일반전표로 이동시킴. 2013-04-29
function tempbill_confirm(obj){
	
	var chk = document.getElementsByName("chk[]");
	var moveList = new Array();
	var flag_list = new Array();

	for(var i = 0; i < chk.length; i++) {
		if(chk[i].checked == true) {
			expend_code = chk[i].getAttribute('expend_code');
			no = chk[i].getAttribute('no');
			move_flag =  chk[i].getAttribute('move_flag');
			moveList.push({
				expend_code : expend_code,
				no : no
			});
			
			flag_list.push(move_flag);
		}
	}
	
	var moveDate = $("#moveDate").val();
	if(moveDate.length != 8){
		MessageBox.alert("이동할 날짜를 정확하게 입력해주세요.");
		return;
	}
	
	var dateStr = moveDate.substr(0,4)+"년 "+moveDate.substr(4,2)+"월 "+moveDate.substr(6,2)+"일";
	if(moveList.length == 0) {
		MessageBox.alert("승인 이동할 청구서를 선택해 주세요.");
		return;
	}
	for(var i = 0, len=flag_list.length; i<len; i++){
		if(flag_list[i] == '승인완료'){
			MessageBox.alert('이미 승인 이동된 청구서가 있습니다. 다시 선택해주세요');
			for(i=0;i<chk.length;i++){
				$(chk[i]).attr('checked', false);
			}
			return;
		}
	}
	var checked_cnt = $('input[name="chk[]"]:checked').length;
	if(confirm("선택한 "+checked_cnt+"건의 전표를 "+dateStr+"로 승인 하시겠습니까?\n 확인을 누르시면 해당 청구서로 입력된 항목이 일반전표로 승인되어 이동합니다." )) {
		$(obj).button('loading');		
		$.post("/bill/tempBill/bill_move", {
			list : moveList, moveDate:moveDate}
		, function(reData) {
			if(!reData.data.result){
				for(i=0;i<chk.length;i++){
					$(chk[i]).attr('checked', false);
				}
				$(obj).button('reset');
				MessageBox.alert(reData.data.msg);
				return false;
			} else {
				for(i=0;i<chk.length;i++){
					if(chk[i].checked == true) {
						//bTable.removeChild($(chk[i].parentNode.parentNode).get(0));
						chk[i].setAttribute('move_flag','승인완료');					
						chk[i].parentNode.nextSibling.childNodes[0].innerHTML = "승인완료";
						$(chk[i]).attr("checked", false);
					}
				}		
				MessageBox.alert("성공적으로 승인(일반전표로 이동)되었습니다");
				$("#movePop").css('display','none');
				$("#temp_checkAll").attr('checked', false);
				$(obj).button('reset');
				toQuery();
				return true;
			}
		});
	}
	clearUnsel();
}





//반려기능 추가 2014-1-10
function expend_turn_down(){
	
	var chk = document.getElementsByName("chk[]");
	var moveList = new Array();
	var flag_list = new Array();

	for(var i = 0; i < chk.length; i++) {
		if(chk[i].checked == true) {
			expend_code = chk[i].getAttribute('expend_code');
			no = chk[i].getAttribute('no');
			move_flag =  chk[i].getAttribute('move_flag');
			moveList.push({
				expend_code : expend_code,
				no : no
			});
			
			flag_list.push(move_flag);
		}
	}

	if(moveList.length == 0) {
	MessageBox.alert("반려할 청구서를 선택해주세요.");
		return;
	}
	for(var i = 0, len=flag_list.length; i<len; i++){
		
		if(flag_list[i] == '승인완료' || flag_list[i] == '반려'){
		MessageBox.alert('반려가 불가능한 청구서가 있습니다. 다시선택해주세요');
			for(i=0;i<chk.length;i++){
				$(chk[i]).attr('checked', false);
				$("#temp_checkAll").attr('checked', false);
			}
			return;
		}
	}

	var checked_cnt = $('input[name="chk[]"]:checked').length;
	var message = "";
	if(churchCode == 4726 ){
		message = prompt("선택한 "+checked_cnt+"건의 전표를 반려시킵니다.\n 반려사유를 입력해주세요" );
		if(message == "") {
			MessageBox.alert("반려사유를 입력해주세요");
		}
		$.each(moveList, function(idx,val){
			moveList[idx].return_reason = message;
		});
	}else{
		message = confirm("선택한 "+checked_cnt+"건의 전표를 반려시킵니다.\n 동의하십니까?");
	}

	if(message != "") {
		$.post("/bill/tempBill/turn_down", {list: moveList}
			, function (data) {
				if (data == "false") {
					for (i = 0; i < chk.length; i++) {
						$(chk[i]).attr('checked', false);
					}
					return false;
				}

				if (data == "no") {
					for (i = 0; i < chk.length; i++) {
						$(chk[i]).attr('checked', false);
					}

					MessageBox.alert('잘못된 접근입니다.');
					return false;
				}

				if (data == "ok") {
					//var bTable = document.getElementById("innerTable2");
					for (i = 0; i < chk.length; i++) {
						if (chk[i].checked == true) {
							//bTable.removeChild($(chk[i].parentNode.parentNode).get(0));
							chk[i].parentNode.nextSibling.childNodes[0].innerHTML = "반려";
							$(chk[i]).attr("checked", false);
							$(chk[i]).attr("move_flag", '반려');
							$("#temp_checkAll").attr('checked', false);
						}
					}
				MessageBox.alert("해당 청구서를 반려했습니다.");
					$("#movePop").css('display', 'none');
					return true;
				}
			});
	}
	clearUnsel();
}



//반려취소 추가 2014-2-11 김유리
function cancle_turn_down(){
	
	var chk = document.getElementsByName("chk[]");
	var moveList = new Array();
	var flag_list = new Array();

	for(var i = 0; i < chk.length; i++) {
		if(chk[i].checked == true) {
			expend_code = chk[i].getAttribute('expend_code');
			no = chk[i].getAttribute('no');
			move_flag =  chk[i].getAttribute('move_flag');
			moveList.push({
				expend_code : expend_code,
				no : no
			});

			flag_list.push(move_flag);
		}
	}

	if(moveList.length == 0) {
	MessageBox.alert("반려할 청구서를 선택해주세요.");
		return;
	}
	for(var i = 0, len=flag_list.length; i<len; i++){
		
		if(flag_list[i] == '승인완료' || flag_list[i] == '대기중'){
		MessageBox.alert('취소가 불가능한 청구서가 있습니다. 다시선택해주세요');
			for(i=0;i<chk.length;i++){
				$(chk[i]).attr('checked', false);
				$("#temp_checkAll").attr('checked', false);
			}
			return;
		}
	}


	var checked_cnt = $('input[name="chk[]"]:checked').length;

	if(confirm("선택한 "+checked_cnt+"건의 전표를 반려취소합니다.\n 동의하십니까?" )) {
		$.post("/bill/tempBill/cancle_turn_down", {list : moveList}
		, function(data) {
			if(data=="false"){			
				for(i=0;i<chk.length;i++){
					$(chk[i]).attr('checked', false);
				}
				return false;
			}
			
			if(data=="no"){			
				for(i=0;i<chk.length;i++){
					$(chk[i]).attr('checked', false);
				}

				MessageBox.alert('잘못된 접근입니다.');
				return false;
			}
			
			if(data == "ok")
			{
				//var bTable = document.getElementById("innerTable2");
				for(i=0;i<chk.length;i++){
					if(chk[i].checked == true) {
						//bTable.removeChild($(chk[i].parentNode.parentNode).get(0));
						chk[i].parentNode.nextSibling.childNodes[0].innerHTML = "대기중";
						$(chk[i]).attr("checked", false);
						$(chk[i]).attr("move_flag", '대기중');
						$("#temp_checkAll").attr('checked', false);
					}
				}

			MessageBox.alert("해당 청구서를 반려취소했습니다.");
				$("#movePop").css('display','none');
				return true;
			}
		});
	}
	clearUnsel();
}



// 가지급 대체일때 submit 시키는 함수
function _submit3(add_list,callBackFunc) {
	var expend_temp = {};
	expend_temp.bank = '';
	expend_temp.name = $("#uName").val();
	expend_temp.pid = $("#pid").val();
	expend_temp.memType = $("#memType").val();
	expend_temp.depth1 = $("#depth1").val();
	expend_temp.depth2 = $("#depth2").val();
	expend_temp.depth3 = $("#depth3").val();
	expend_temp.acntCode = $("#acntCodeTemp").val();
	
	expend_temp.before_total = $("#budget").text().split(',').join('') - $("#last_balance").text().split(',').join('');
	expend_temp.balance = $("#calc_balance").text().split(',').join('');
	expend_temp.account_option = 1;

    expend_temp.proposal_department = $("#proposal_department").val();
    expend_temp.proposer = $("#proposer").val();

	if(expend_temp.etc == null){
		expend_temp.etc  ='';
	}
	expend_temp.expend_type = $(".expend_type").find(".active input").val();
	expend_temp.replace_code = replace_code; 
	var replaceSum = sumMoney();
	if(replaceSum > 0){
		expend_temp.expend_sub_type = '추가청구';
		expend_temp.bank = $('#replace_bank').val();
		expend_temp.holder = $('#replace_holder').val();
		expend_temp.account_no = $('#replace_account').val();
		expend_temp.replace_sum = replaceSum;
		// 추가 청구하므로 잔여예산이 줄어든다.
		

		expend_temp.balance -= replaceSum;

	}else if(replaceSum < 0){	// 가지급 반환금이 발생할 경우.

		expend_temp.expend_sub_type = $(".sel_sub_type").find(".active input").val();
		if(expend_temp.expend_sub_type == '잔금이월'){
		// 잔금 이월하므로 잔여예산이 그대로 남는다.
		}else if(expend_temp.expend_sub_type == '잔금반환'){
		// 잔금반환 하므로 잔여예산이 다시 불어난다.
			expend_temp.balance -= replaceSum;
		}else{	// 금액일치.

		}

	}else if(replaceSum == 0){
		expend_temp.expend_sub_type = '지출청구';
	}
	expend_temp.write_input_type = $("#btn_save").val(); //"$("#write_tabs .write_tabs_menu.active").data("write-input-type");
	//alert($("#budget").text()+" : "+$("#last_balance").text()+" : "+$("#calc_balance").text()+" : "+sumMoney());


	//return false; 

	var addlist = JSON.stringify(add_list);
	var expendlist = JSON.stringify(expend_temp);
	
	$.post("/bill/tempBill/expend_list_save", { add_list : addlist, expend_list :expendlist }, function(reData) {
		if(reData){
			if(reData == 'year') {
				MessageBox.alert("마감된 회계기수에서는 등록할 수 없습니다.");
				top.document.location.reload();
				return false;
			}
			else if (reData == 'acntCode') {
				MessageBox.alert("내부 서버오류가 발생하여 페이지를 새로고침합니다.");
				top.document.location.reload();
				return false;
			}else if(reData == 'duplicateCode'){
				MessageBox.alert("코드 생성시 문제가 발생했습니다. 고객센터로 문의해 주시기 바랍니다.");
				return false;
			} else if(reData == 'errorNotEnoughBudget') {
				MessageBox.alert("재정청구 누계가 예산을 초과하여 청구서 등록이 불가합니다.\n청구서 목록을 확인하여 잘못 청구된 건을 삭제 후 진행해 주세요.")
				return false;
			} else{
				WindowLocation.href = '/bill/tempBill/bill_write/income';
				view_popup2(reData);
			}

		}
		else{
		MessageBox.alert('등록오류');
		}
		
		return true;
	});
}

var invoiceMode = 'hallell';

//재정청구서 새로 작성 후 submit
function _submit2(add_list,resultURL) {
	var expend_temp = {};

	expend_temp.bankID = $("#parent_bankID").val();
	expend_temp.bank = $("#parent_bank").val();
	expend_temp.bankName = $("#parent_bankName").val();
	expend_temp.holder=$("#parent_holder").val();
	expend_temp.account_no =$("#parent_account_no").val();
	expend_temp.name = $("#parent_receiver").val();
	expend_temp.pid = $("#parent_pid").val();
	expend_temp.memType = $("#parent_memType").val();

	expend_temp.depth1 = $("#depth1").val();
	expend_temp.depth2 = $("#depth2").val();
	expend_temp.depth3 = $("#depth3").val();
	expend_temp.acntCode = $("#acntCodeTemp").val();
	expend_temp.schedule_date = $("#date2").val();

	expend_temp.before_total = $("#budget").text().split(',').join('') - $("#last_balance").text().split(',').join('');
	expend_temp.balance = $("#calc_balance").text().split(',').join('');

	expend_temp.account_option = 1;
	expend_temp.proposal_department = $("#proposal_department").val();
	expend_temp.proposer = $("#proposer").val();
	expend_temp.write_input_type = $("#btn_save").val();

	expend_temp.expend_type = $(".expend_type").find(".active input").val();
	if(expend_temp.expend_type == '가지급대체'){
		expend_temp.expend_sub_type = $("#expend_sub_type").val();
	}

	if(expend_temp.etc == null){
		expend_temp.etc  ='';
	}
	
	var addlist = JSON.stringify(add_list);
	var expendlist = JSON.stringify(expend_temp);

	$.post("/bill/tempBill/expend_list_save", { add_list : addlist, expend_list :expendlist }, function(reData) {
		if(reData){
			if(reData == 'year') {
				MessageBox.alert("마감된 회계기수에서는 등록할 수 없습니다.");
				top.document.location.reload();
				return false;
			} else if (reData == 'acntCode') {
				MessageBox.alert("내부 서버오류가 발생하여 페이지를 새로고침합니다.");
				top.document.location.reload();
				return false;
			} else if(reData == 'bank'){
				MessageBox.alert("선택할수 없는 계좌입니다.");
				$("#bankName").focus();
				return false;
			}else if(reData == 'duplicateCode'){
				MessageBox.alert("코드 생성시 문제가 발생했습니다. 고객센터로 문의해 주시기 바랍니다.");
				return false;
			}else if(reData == 'errorAcntYear'){
				MessageBox.alert("회계연도를 벗어난 날짜는 청구서 등록이 불가능합니다.");
				return false;
			} else if(reData == 'errorNotEnoughBudget') {
				MessageBox.alert("재정청구 누계가 예산을 초과하여 청구서 등록이 불가합니다.\n청구서 목록을 확인하여 잘못 청구된 건을 삭제 후 진행해 주세요.")
				return false;
			}
			var expendListView = null;
			var listURL = '/bill/tempBill/listView';
			var iframeList = $(parent.document).find('iframe');

			for (var i = 0, iframe; iframe = iframeList[i]; i++) {
				var urlIdx = $(iframe).attr('src').indexOf(listURL);
				if (urlIdx >= 0) {
					expendListView = iframe;
					break;
				}
			}
			if (expendListView != null) {
				expendListView.contentWindow.toQuery();
			}
			WindowLocation.href = resultURL;
			view_popup2(reData);
		}
		else{
		MessageBox.alert('등록오류');
		}
		return true;
	});
}


//수정모드일때의 전송. 
function modify_submit2(modify_list,code,resultURL) {
	var expend_temp = {};
	expend_temp.bankID = $("#parent_bankID").val();
    expend_temp.bank = $("#parent_bank").val();
	expend_temp.bankName = $("#parent_bankName").val();
    expend_temp.holder=$("#parent_holder").val();
    expend_temp.account_no =$("#parent_account_no").val();
	expend_temp.name = $("#parent_receiver").val();
	expend_temp.pid = $("#parent_pid").val();
	expend_temp.memType = $("#parent_memType").val();
	expend_temp.billType = $("#parent_billType").val();	// 1: 수입 , 2 : 지출 (전송 후 계좌유무에 따라 2,6 혹은 1,5 로 변환)

	expend_temp.depth1 = $("#depth1").val();
	expend_temp.depth2 = $("#depth2").val();
	expend_temp.depth3 = $("#depth3").val();
	expend_temp.acntCode  = $("#acntCodeTemp").val();
	expend_temp.schedule_date = $("#date2").val();

	expend_temp.before_total = $("#budget").text().split(',').join('') - $("#last_balance").text().split(',').join('');
	expend_temp.balance = $("#calc_balance").text().split(',').join('');

	expend_temp.account_option = 1;
	expend_temp.proposal_department = $("#proposal_department").val();
	expend_temp.proposer = $("#proposer").val();
	expend_temp.write_input_type = $("#btn_save").val();

	expend_temp.expend_type = $(".expend_type").find(".active input").val();

	expend_temp.registrant = $("#registrant").val();
	expend_temp.replace_code = replace_code;	// origin_code
	expend_temp.expend_code = code;				// 기존 재정청구서

	expend_temp.billDate = $("#date").val();


	var replaceSum = sumMoney();
	if(expend_temp.expend_type == '가지급대체'){
		if(replaceSum > 0){
			expend_temp.expend_sub_type = '추가청구';
			expend_temp.bank = $('#replace_bank').val();
			expend_temp.holder = $('#replace_holder').val();
			expend_temp.account_no = $('#replace_account').val();
			expend_temp.replace_sum = replaceSum;
		}else if(replaceSum < 0){
			expend_temp.expend_sub_type = $(".sel_sub_type").find(".active input").val();
			
		}else if(replaceSum == 0){
			expend_temp.expend_sub_type = '지출청구';
		}
	}

	var expendlist = JSON.stringify(expend_temp);
	var modifylist = JSON.stringify(modify_list);

	$.post("/bill/tempBill/expend_list_modify/"+expend_edit.copy_mode, {expend_list:expendlist, modify_list:modifylist  }, function(reData) {

		if(reData == 'bank'){
			MessageBox.alert("선택할수 없는 계좌입니다.");
			$("#bankName").focus();
			return false;
		} else if(reData == 'not available account code'){
            MessageBox.alert("이번회기에서 사용할수 없는 계정 혹은 부모계정 입니다.");
            return false;
        } else if(reData == 'errorAcntYear'){
			MessageBox.alert("회계연도를 벗어난 날짜는 청구서 등록이 불가능합니다.");
			return false;
		}
		else if(reData){
			if(typeof parent.tabMenuController == 'undefined'){
				WindowLocation.href = resultURL;
			}
			else{

				parent.tabMenuController.moveTab("재정청구서 목록","toQuery");
				WindowLocation.href = resultURL;
			}
			view_popup2(reData);
		}
	});
}


function _del(trID) {

	var confirmMsg = "선택한 항목을 정말 삭제 하시겠습니까?";
	
	var count_no = $("#innerTable").find("tr").index($("#"+trID.id));
//	var count_no = $("#innerTable").find("tr").index($("#"+trID.id));
	var bTable = document.getElementById("innerTable");
	var dateTemp = tempBillList.data[count_no];
	
	selectRow = count_no;

	
	if(confirm(confirmMsg)){
		
		tempBillList.data.splice(count_no,1);
		bTable.removeChild($("#"+trID.id).get(0));
		CDVList.count_no--;
	}
	
	//clearUnsel();
	
	sumMoney();
	calc_budget();
}

function _del2(trID) {
    var thisObj = $(trID).closest("tr");
	var parent =$(trID).closest("table");
	var count_no =parent.find("tr").index(thisObj);

	selectRow = count_no;

	if(confirm("선택한 항목을 정말 삭제 하시겠습니까?")){
        if(count_no == -1){
           MessageBox.alert("삭제에 문제가 발생했습니다.");
            return;
        }
		tempBillList.data.splice(count_no,1);
		//thisObj.remove();
		$(trID).parent().parent().parent().remove();
		//bTable.removeChildren(thisObj.get(0));
		CDVList.count_no--;
	}
	sumMoney();
	calc_budget();
}


//승인한 재정청구서를 승인 취소함.2013112.05	
// 이 함수를 빠뜨렸었음. 왜죠? 2014. 2. 8 엄태범.
function tempbill_confirm_cancel(){
	
	var chk = document.getElementsByName("chk[]");
	var moveList = new Array();
	var flag_list = new Array();

	for(var i = 0; i < chk.length; i++) {
		if(chk[i].checked == true) {
			expend_code = chk[i].getAttribute('expend_code');
			no = chk[i].getAttribute('no');
			move_flag =  chk[i].getAttribute('move_flag');
			moveList.push({
				expend_code : expend_code,
				no : no
			});
			
			flag_list.push(move_flag);
		}
	}
	moveStr ='일반전표';
	if(moveList.length == 0) {
	MessageBox.alert("승인 취소할 청구서를 선택해 주세요.");
		return;
	}
	for(var i = 0, len=flag_list.length; i<len; i++){
		
		if(flag_list[i] == '대기중' || flag_list[i] == '반려' ){
		MessageBox.alert('승인되지 않은 청구서가 있습니다. 다시 선택해주세요');
			for(i=0;i<chk.length;i++){
				$(chk[i]).attr('checked', false);
			}
			$("#temp_checkAll").attr('checked', false);
			return;
		}
	}
	
	$.post("/bill/tempBill/origin_code_search", { list : moveList }
	,function(reData) {
		var code = JSON.parse(reData);
		for(var i=0;i<code.length;i++){
			if(code[i] != null){
				MessageBox.alert('이미 가지급 대체가 발생되었으므로('+code[i]+') 선택한 가지급금 청구서의 승인취소가 불가능합니다.발생된 가지급 대체 청구서를 반려 또는 삭제 후 다시 시도해주시기 바랍니다.');
				for(var j=0;j<chk.length;j++){
					if(i == j){
						$(chk[j]).attr('checked', false);
					}
				}
				$("#temp_checkAll").attr('checked', false);
				return false;
			}
			
		}

		var checked_cnt = $('input[name="chk[]"]:checked').length;
		if(confirm("선택한 "+checked_cnt+"건의 전표를 승인취소 하시겠습니까?" )) {
			$.post("/bill/tempBill/bill_move_cancel", {
				list : moveList}
			, function(reData) {

				if(reData=="false"){			
					for(i=0;i<chk.length;i++){
						$(chk[i]).attr('checked', false);
					}
					return false;
				}

				if(reData=="year"){
					for(i=0;i<chk.length;i++){
						$(chk[i]).attr('checked', false);
					}

					MessageBox.alert('결산된 기수의 청구서는 취소할 수 없습니다.');
					return false;
				}
				
				if(reData=="no"){			
					for(i=0;i<chk.length;i++){
						$(chk[i]).attr('checked', false);
					}
					$("#temp_checkAll").attr('checked', false);

					MessageBox.alert('잘못된 접근입니다.');
					return false;
				}
				if(reData == "temporary close"){
					for(i=0;i<chk.length;i++){
						$(chk[i]).attr('checked', false);
					}

				MessageBox.alert("마감설정된 날짜 이전의 날짜는 승인취소 할 수 없습니다.");
					$(obj).button('reset');
					return false;
				}
				if(reData == "ok")
				{		
				MessageBox.alert("선택하신 청구서의 승인이 취소되었습니다.");
					toQuery();
				}
			});
		}else{
			$(chk[i]).attr('checked', false);
			$("#temp_checkAll").attr('checked', false);
			return false;
		clearUnsel();
		}
	});
}

//var copy_mode = 0;
var modify = false;


//재정청구서 리스트에서의 삭제
function expend_del(){
	var code = new Array();
	var state = new Array();
	var chk = document.getElementsByName("chk[]");
	var cnt = 0;
	for(var i = 0; i < chk.length; i++) {
		if(chk[i].checked == true) {
			
			code.push(chk[i].getAttribute('expend_code'));
			state.push(chk[i].getAttribute('move_flag'));
			cnt++;
		}
	}

	if(cnt == 0){
	MessageBox.alert("삭제할 청구서를 선택해주세요");
		return;
	}
	else{
		for(var i=0; i<chk.length; i++){
			if(state[i] == '승인완료'){
				MessageBox.alert('이미 승인이 완료된 청구서는 삭제가 불가합니다.');
				for(var i = 0; i < chk.length; i++) {
					if(chk[i].checked == true) {
						chk[i].checked = false;
					}	
				}	
				
				return false;
			}
		}
	}
	
	if(confirm('선택하신 목록('+cnt+'건)을 삭제하시겠습니까?')){
		$.post("/bill/tempBill/delete_expend_list", {code:code}, function(reData) {
			if(reData == 'ok'){
				var bTable = document.getElementById("innerTable2");
				for(var i=cnt-1; i>=0; i--) {
					bTable.removeChild($("#expend_list_"+code[i]).get(0));
				}

				MessageBox.alert('삭제되었습니다.');
				sumMoney();
//				calc_budget();
			}
			else{
				
			MessageBox.alert('삭제오류!! 오직 고객센터로 문의해주세요');
				for(var i = 0; i < chk.length; i++) {
					if(chk[i].checked == true) {
						chk[i].checked = false;
					}	
				}	
			}
		});
		
	}
}
		
//하단 합계 금액 표시
function sumMoney() {
	var sum=0;
	var write_type = $("#btn_save").val();
	var i;
	var sumTable = "";
	if(write_type == 3)
	{
		sumTable = "sumTable3";
	}
	else
	{
		sumTable = "sumTable1";
	}
	
	for(i=0; i < CDVList.prepare_list.data.length; i++) {
		if(CDVList.prepare_list[i]!=''){
			sum += Number(CDVList.prepare_list.data[i].money.split(",").join(""));
		}
	}
	
	$("#"+sumTable+" .sum").text(number_format(sum));
	
	if($('.expend_type .active input').val() == '가지급대체'){
		
		var replace_sum = 0;
		if(replace_money > -1){
			replace_sum = replace_money;
		}else{
			replace_sum = $('#state_btn').attr('sum');
		}
		
		if(sum > replace_sum){
			$('#'+sumTable+' .replaceSumText').text('추가금');
			$('#'+sumTable+'.replaceSum').text(number_format(sum - replace_sum));
		}else if(sum < replace_sum){
			$('#'+sumTable+'.replaceSumText').text('반환금');
			$('#'+sumTable+'.replaceSum').text(number_format(replace_sum - sum));
		}else{
			$('#'+sumTable+'.replaceSumText').text('추가금 없음');
			$('#'+sumTable+'.replaceSum').text('');
		}
		return sum - replace_sum;
		
	}else{
		$('#'+sumTable+'.replaceSumText').text('');
		$('#'+sumTable+'.replaceSum').text('');
		return sum;
	}
}

function changeName(pidNum) {
	$('#pid').val('');
	$('#memType').val('');
} 


var billTypes = new Array();
billTypes[2] = '출금';


$(function() {
	$('input:text').focus(function() {
		$(this).addClass('focused');
	});

	$('input:text').blur(function() {
		$(this).removeClass('focused');
	});
	
	$("#sub_date").hide();

	var onShift = false;
	manual('<span style="color:#226dbe"></span>');


	var scInputTypeText = $(".billBoardDetail2 :text");
	scInputTypeText.keydown(function(event){
		if(event.keyCode==13 && $("#selectBox").css('display')=='none'){
			toQuery();
		}
	});
	
	
	var memTypeRadio = $('.memTypeRadio');
	memTypeRadio.click(function(){
		$("#pid").val('');
	});

	InputText('.inputValue');
	InputText('.write_input3');
	var inputTypeText = $('.inputValue :text');
	inputTypeText.focus(function() {
		this.select();
		switch(this.id) {
			case 'date':
				msg = '입력예시 ) 20110820';
				break;
			case 'billType':
			case 'acntName':
			case 'bankID':
			case 'uName':
				msg = '';
				break;
			case 'amount':
			case 'amount2':
				msg = ' <span style="font-weight:bold; color:#0e4ead;">[/]</span> : 0000,  <span style="font-weight:bold; color:#0e4ead;">[* 또는 +]</span> : 000';
				break;
			case 'sc_date':
			case 'sc_billType':
			case 'sc_acntName':
			case 'sc_bankID':
			case 'sc_uName':
			case 'sc_amount':
				msg = '';
				break;
			default:
				if(tabMenu==1)
					msg = '';
				else msg = '';
				break;
		}
		manual(msg);

	});
});
