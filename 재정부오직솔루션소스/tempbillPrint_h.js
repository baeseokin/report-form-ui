//##############################################################전표 출력 관련##############################################################

//전표조회
function toQuery(check) {
	
	//check는 가지급대체일이 지난 전표를 조회 하기 위한 flag임
	tempNum = 0;
	cutFlag = 0;
	chkPeriod = 1;
	isEnd = false; //2012-03-29 김지연
	
	start = getTimeStamp($('#qwer').val().substr(0,4),Number($('#qwer').val().substr(4,2))-1,$('#qwer').val().substr(6,2));
	end = getTimeStamp($('#asdf').val().substr(0,4),Number($('#asdf').val().substr(4,2))-1,$('#asdf').val().substr(6,2));	
	
	$("#print_sumname").val($("#sc_sumname").val());
	$("#print_acnt_name").val($("#sc_acnt_name").val());
	$("#print_name").val($("#sc_name").val());
	$("#print_scmoney").val($("#sc_money").val());
	$("#print_state_drop").val($("#state_drop").val());
	$("#print_date_type").val($(".date_type").find(".active input").val());
	
	var expend_drop = new Array();
	$("#expend_type_select").find('input').each(function(){	
		if($(this).prop('checked')== true)
			expend_drop.push('"'+$(this).val()+'"');
	});
	
	$("#print_expend_drop").val(expend_drop);

	$("#excel_acnt_name").val($("#sc_acnt_name").val());
	$("#excel_sumname").val($("#sc_sumname").val());
	$("#excel_name").val($("#sc_name").val());
	$("#excel_scmoney").val($("#sc_money").val());
	$("#excel_state_drop").val($("#state_drop").val());
	$("#excel_expend_drop").val(expend_drop);
	$("#excel_date_type").val($(".date_type").find(".active input").val());


	$('#excel_all').val(0);
	$('#excel_proposal_department').val('');
	$('#excel_proposer').val('');
	$('#excel_name').val('');
	$('#excel_registrant_name').val('');

	$('#print_all').val(0);
	$('#print_proposal_department').val('');
	$('#print_proposer').val('');
	$('#print_name').val('');
	$('#print_registrant_name').val('');

	var search_option = $("#search_option").val();
	if(search_option == "all"){
		$('#excel_all').val(1);
		$('#excel_proposal_department').val($("#search_value").val());
		$('#excel_proposer').val($("#search_value").val());
		$('#excel_name').val($("#search_value").val());
		$('#excel_registrant_name').val($("#search_value").val());

		$('#print_all').val(1);
		$('#print_proposal_department').val($("#search_value").val());
		$('#print_proposer').val($("#search_value").val());
		$('#print_name').val($("#search_value").val());
		$('#print_registrant_name').val($("#search_value").val());
	}
	else if(search_option == "proposal_department"){
		$('#excel_all').val(0);
		$('#excel_proposal_department').val($("#search_value").val());

		$('#print_all').val(0);
		$('#print_proposal_department').val($("#search_value").val());
	}
	else if(search_option == "proposer"){
		$('#excel_all').val(0);
		$('#excel_proposer').val($("#search_value").val());

		$('#print_all').val(0);
		$('#print_proposer').val($("#search_value").val());
	}
	else if(search_option == "name"){
		$('#excel_all').val(0);
		$('#excel_name').val($("#search_value").val());

		$('#print_all').val(0);
		$('#print_name').val($("#search_value").val());
	}
	else if(search_option == "registrant_name"){
		$('#excel_all').val(0);
		$('#excel_registrant_name').val($("#search_value").val());

		$('#print_all').val(0);
		$('#print_registrant_name').val($("#search_value").val());
	}



	if(check){
		$("#excel_schedule_over").val(check);
		$("#print_schedule_over").val(check);
		$("#schedule_over").val(check);
	}
	else{
		$("#excel_schedule_over").val("");
		$("#print_schedule_over").val("");
	}
	
	$("#innerTable2").html('');
	$("#sum").html("");
	$("#sum2").html("");
	$('#sumResultText').html("");
	setBrowsHeight('inputBox2',222+set_brows_size_gap);

	if(isLoading == false){
		loading(check);
	}
	return false;
}

//조회하기전에 체크
function inputCheck(){
	var chkDate = new Array();
	chkDate.push($('#qwer').val().substr(0,4));
	chkDate.push($('#qwer').val().substr(4,2));
	chkDate.push($('#qwer').val().substr(6,2));

	
	chkDate.push($('#asdf').val().substr(0,4));
	chkDate.push($('#asdf').val().substr(4,2));
	chkDate.push($('#asdf').val().substr(6,2));

	var i;
	for(i=0;i<chkDate.length;i++){
		if(chkDate[i]==''||chkDate[i]<1){
			alert("날짜를 제대로 입력해주세요.");
			exit;
		}
	}
	return;
}

//조회날짜받아옴
function getTimeStamp(year, month, day) { 
	var date = new Date(year, month, day);
	
	
	return Math.floor(date.getTime() / 1000);
}

//전표 리스트를 로딩하는 함수입니다.
function loading(check) {
	
	isLoading = true;
	//$("#loadingMsgBox").stop().fadeIn();
	var text = '데이터를 불러오는 중입니다.';
	$.blockUI({
		showOverlay: false,
		message: '<h3 style="font-size: 15px;padding: 0;margin:0;font-family: malgun gothic;font-weight: normal;"><img style="width:25px; height: 25px; margin: -13px 10px -7px 0;" src="/images/loading-white.gif" />' + text + '</h3>',
		css: {
			width: '260px',
			border: 'none',
			padding: '15px',
			backgroundColor: '#69a5b9',
			'-webkit-border-radius': '10px',
			'-moz-border-radius': '10px',
			'border-radius': '10px',
			opacity: .9,
			color: '#fff'
		}
	});
	ajaxController(check);
}


//페이지에서 호출되는 모든 ajax 함수를 컨트롤합니다.
function ajaxController(check) {
	
	billList.getBillInfo(check);
	billList.getBillList(check);
}

function make_tr(callBackFunc)
{
	CDVList.makeTr(callBackFunc);
		
}

var CDVList = {
	
	add_acntName : new Array()
	,add_money : new Array()
	,prepare_list : {data:new Array()}
	,modify_list : new Array()
	,billType : 0
	,expend_list : new Array()
	,count_no : 0
	,modify_no : 0
	,count : 0
	,saveTempBillList : function(){	// 기안문 형식 저장시에 사용.
		var data_temp = {};
		this.count_no = 1;
		this.modify_no = 0;
		this.prepare_list.data = [];
		oEditors.getById["sumName2"].exec("UPDATE_CONTENTS_FIELD", []);
		
		data_temp.billDate = $("#date").val();
		data_temp.type = $("#billType").val();
		data_temp.bankName = $("#bankName").val();
		data_temp.bankID = $("#bankID").val();
		
		data_temp.count_no = this.count_no;
		
		data_temp.sumName = $('#sumName2').val();
		data_temp.money = $("#amount").val();
		
		data_temp.account_bank = $('#bank').val();
		data_temp.account_holder = $('#holder').val();

		data_temp.account_no = $('#account_no').val();
		
		data_temp.name = $('#uName').val();
		data_temp.pid = $('#pid').val();
		
		data_temp.acntCode = $("#acntCodeTemp").val();
		data_temp.acntName = $("#acntName").val();
		data_temp.depth1_code =$("#depth1").val();
		data_temp.depth2_code =$("#depth2").val();
		data_temp.depth3_code =$("#depth3").val();
		
		this.prepare_list.data.push(data_temp);
		tempBillList = this.prepare_list;
	}
	,setTempBillList : function(data,code){	// 기안문 형식에서만 사용. 로드 해온 전표 정보를 입력화면에 표시해주기 위해 사용.
		this.prepare_list =  $.parseJSON(data);
		this.expend_code = code;
		this.modify_no = 1;
		$('input:radio[name=expend_type]:input[value='+this.prepare_list.expend.expend_type+']').attr("checked", true);
		$('input:radio[name=expend_type]:input[value="영수증완비"]').parent().removeClass('active');
		$('input:radio[name=expend_type]:input[value='+this.prepare_list.expend.expend_type+']').parent().addClass('active');
		
		$("#depth1").val(this.prepare_list.expend.depth1);
		$("#depth2").val(this.prepare_list.expend.depth2);
		$("#depth3").val(this.prepare_list.expend.detph3);
		$("#registrant_name").val(this.prepare_list.expend.registrant_name);
		$("#proposal_department").val(this.prepare_list.expend.proposal_department);
		$("#proposer").val(this.prepare_list.expend.proposer);
			
		if(this.prepare_list.expend.expend_type == '가지급금'){

			$("#acntName").val(this.prepare_list.expend.acntName);
			$("#acntCodeTemp").val(this.prepare_list.expend.acntCode);
			
			$("#sub_date").show();
			
			var date2 =  this.prepare_list.expend.schedule_date.split('-').join('');
			var date1 =  this.prepare_list.expend.billDate.split('-').join('');
			
			$("#date2").val(date2);
			
		}
		else if(this.prepare_list.expend.expend_type == '가지급대체') {
			
			$("#state_btn").html('대체 영수증 선택<span class="caret"></span>');
			$("#acntName").val(this.prepare_list.expend.acntName);
			$("#acntCodeTemp").val(this.prepare_list.expend.acntCode);
		}
		else{
			$("#acntName").val(this.prepare_list.expend.acntName);
			$("#acntCodeTemp").val(this.prepare_list.expend.acntCode);
		}


		$("#bankName").val(this.prepare_list.data[0].bankName);
		$("#bankID").val(this.prepare_list.data[0].bankID);
		$("#uName").val(this.prepare_list.data[0].name);
		$("#pid").val(this.prepare_list.data[0].pid);
		$("#memType").val(this.prepare_list.data[0].memType);
		$("#registrant").val(this.prepare_list.data[0].registrant);
		$("#bank").val(this.prepare_list.data[0].account_bank);
		$("#holder").val(this.prepare_list.data[0].account_holder);
		$("#account_no").val(this.prepare_list.data[0].account_no);
		$("#amount").val(this.prepare_list.data[0].money);
		$("#sumName2").val(this.prepare_list.data[0].sumName);
		
		tempBillList = this.prepare_list;
	}
	,modifyTempBillList : function(){	// 기안문 형식일 경우에만 사용함.
		var data_temp = {};
		this.count_no = 1;
		this.modify_no = 1;
		oEditors.getById["sumName2"].exec("UPDATE_CONTENTS_FIELD", []);
		
		data_temp.billDate = $("#date").val();
		data_temp.type = $("#billType").val();
		data_temp.bankName = $("#bankName").val();
		data_temp.bankID = $("#bankID").val();
		
		data_temp.count_no = this.count_no;
		
		data_temp.sumName = $('#sumName2').val();
		data_temp.money = $("#amount").val();
		
		data_temp.account_bank = $('#bank').val();
		data_temp.account_holder = $('#holder').val();

		data_temp.account_no = $('#account_no').val();
		
		data_temp.name = $('#uName').val();
		data_temp.pid = $('#pid').val();
		
		data_temp.acntCode = $("#acntCodeTemp").val();
		data_temp.acntName = $("#acntName").val();
		data_temp.depth1_code =$("#depth1").val();
		data_temp.depth2_code =$("#depth2").val();
		data_temp.depth3_code =$("#depth3").val();
		
		this.prepare_list.data = [];
		this.prepare_list.data.push(data_temp);
		tempBillList = this.prepare_list;
	}
	,makeTr : function (callBackFunc){
		var data_temp = {};
		var writeInputType = $("#btn_save").val();
		this.count_no = writeInputType != 3 ? $("#innerTable tr").length+1 : $("#inputBox3 .innerTable tr").length+1;
		if(this.count_no > 7 && writeInputType == 3)
		{
			alert("선택하신 양식은 최대 7개까지만 입력가능합니다.");
			return false;
		}
		
		data_temp.billDate = $("#date").val();
		data_temp.count_no = this.count_no;
		
		var tdHtml = "";
		var trHtml = "<tr id=temp"+this.count_no +">";
		
		data_temp.acntCode = $("#acntCodeTemp").val();
		data_temp.acntName = $("#acntName").val();
		data_temp.depth1_code =$("#depth1").val();
		data_temp.depth2_code =$("#depth2").val();
		data_temp.depth3_code =$("#depth3").val();
		data_temp.type = $("#billType").val();
		
		billDate =  data_temp.billDate.substr(0,4)+"-"+data_temp.billDate.substr(4,2)+"-"+data_temp.billDate.substr(6,2);
		if(writeInputType == 3)	// 오륜교회, 계좌 고정 방식
		{
            data_temp.acntName = $("#child_account_name").val();
            data_temp.acntCode = $("#child_account_code").val();
			data_temp.sumName = $("#sumName3").val();
			data_temp.money = $("#amount3").val();
			if(!data_temp.sumName)
			{
                $("#sumName3").focus();
				return false;
			}
			if(!data_temp.money)
			{
                $("#amount3").focus();
				return false;
			}

            if(!data_temp.acntCode){
                $("#child_account_code").focus();
                return false;
            }

			this.prepare_list.data.push(data_temp);
			tdHtml+= "<td style='text-align:right;'><span style='padding-right:7px'>" +	data_temp.acntName + "</span></td>";
            tdHtml+= "<td style='text-align:right;'><span style='padding-right:7px'>" +	data_temp.money + "</span></td>";
			tdHtml+= "<td style='text-align:left;'><span style='padding-left:5px'>" + data_temp.sumName + "</span><span style='padding-left:7px;float:right'>" +
			"<button class='btn btn-default list_btn' onclick='selBill2(this);'><i class='icon-pencil'></i></button>" +
			"<button class='btn btn-default list_btn' onclick='_del2(this);'><i class='icon-trash'></i></button></span></td>";
			if($(".expend_type").find(".active input").val() == '가지급대체'){
	
				$("#bank").prop('disabled',true);
				$("#holder").prop('disabled',true);
				$("#account_no").prop('disabled',true);
				
			}
			trHtml += tdHtml;
			trHtml += "</tr>";
			$("#inputBox3 .innerTable").append(trHtml);
		}
		else
		{

			//data_temp.type = $("#billType").val();
			data_temp.bankName = $("#bankName").val();
			data_temp.bankID = $("#bankID").val();
			data_temp.sumName = $("#sumName").val();
			data_temp.money = $("#amount").val();
			data_temp.account_bank = $('#bank').val();
			data_temp.account_holder = $('#holder').val();
			data_temp.account_no = $('#account_no').val();
			data_temp.name = $('#uName').val();
			data_temp.pid = $('#pid').val();
			
			if(!submitCheck())
			{
				return false;
			}
	
			this.prepare_list.data.push(data_temp);

            //tdHtml+= "<td style='text-align:right;'><span style='padding-right:7px'>" +	data_temp.acntName + "</span></td>";
			tdHtml+= "<td style='text-align:center'><span>" + data_temp.bankName + "</span></td>";
			tdHtml+= "<td style='text-align:center'><span>" + data_temp.name+ "</span></td>";
			if($(".expend_type").find(".active input").val() == '가지급대체'){
	
				$("#bank").prop('disabled',true);
				$("#holder").prop('disabled',true);
				$("#account_no").prop('disabled',true);
				
			}
			tdHtml+= "<td style='text-align:center'><span>" + data_temp.account_bank+ "</span></td>";
			tdHtml+= "<td style='text-align:center'><span>" + data_temp.account_holder + "</span></td>";
			tdHtml+= "<td style='text-align:center'><span>" + data_temp.account_no + "</span></td>";	
			tdHtml+= "<td style='text-align:right;'><span style='padding-right:7px'>" +	data_temp.money + "</span></td>";
			tdHtml+= "<td style='text-align:left;overflow-wrap: break-word;'><span style='padding-left:5px'>" + data_temp.sumName + "</span><span style='padding-left:7px;float:right'>" +
					"<button class='btn btn-default list_btn' onclick='selBill2(this);'><i class='icon-pencil'></i></button>" +
					"<button class='btn btn-default list_btn' onclick='_del2(this);'><i class='icon-trash'></i></button></span></td>";
			
			trHtml += tdHtml;
			trHtml += "</tr>";
			
			$("#innerTable").append(trHtml);
		}
		
		sumMoney();
		calc_budget();
		tempBillList = this.prepare_list;
		
		callBackFunc(true);
	}

	,modifyTr : function (data,code){
		
		this.prepare_list =  $.parseJSON(data);
		this.expend_code = code;

		$('input:radio[name=expend_type]:input[value='+this.prepare_list.expend.expend_type+']').attr("checked", true);
		$('input:radio[name=expend_type]:input[value="영수증완비"]').parent().removeClass('active');
		$('input:radio[name=expend_type]:input[value='+this.prepare_list.expend.expend_type+']').parent().addClass('active');
		
		$("#depth1").val(this.prepare_list.expend.depth1);
		$("#depth2").val(this.prepare_list.expend.depth2);
		$("#depth3").val(this.prepare_list.expend.detph3);
		$("#registrant_name").val(this.prepare_list.expend.registrant_name);
		$("#proposal_department").val(this.prepare_list.expend.proposal_department);
		$("#proposer").val(this.prepare_list.expend.proposer);

		if(this.prepare_list.expend.expend_type == '가지급금'){

			$("#acntName").val(this.prepare_list.expend.acntName);
			$("#acntCodeTemp").val(this.prepare_list.expend.acntCode);
			
			$("#sub_date").show();
			
			var date2 =  this.prepare_list.expend.schedule_date.split('-').join('');
			var date1 =  this.prepare_list.expend.billDate.split('-').join('');
			
			$("#date2").val(date2);
			//$("#date").val(date1);
			
		}
		else if(this.prepare_list.expend.expend_type == '가지급대체') {
			
			$("#state_btn").html('대체 영수증 선택<span class="caret"></span>');
			$("#acntName").val(this.prepare_list.expend.acntName);
			$("#acntCodeTemp").val(this.prepare_list.expend.acntCode);
		}
		else{
			$("#acntName").val(this.prepare_list.expend.acntName);
			$("#acntCodeTemp").val(this.prepare_list.expend.acntCode);
		}


		this.modify_no = this.prepare_list.data.length;
	
		for(var i=0; i< this.modify_no;i++) {
			
			$("#registrant").val(this.prepare_list.data[0].registrant);
			billDate =  this.prepare_list.data[i].billDate.substr(0,4)+"-"+this.prepare_list.data[i].billDate.substr(4,2)+"-"+this.prepare_list.data[i].billDate.substr(6,2);
			var tdHtml = "";
			var trHtml = "<tr id=temp"+i +">";
			if($("#btn_save").val() != '3')
			{
				//tdHtml+= "<td style='text-align:center'><span>" + this.prepare_list.data[i].acntName + "</span></td>";
				tdHtml+= "<td style='text-align:center'><span>" + this.prepare_list.data[i].bankName + "</span></td>";
				tdHtml+= "<td style='padding-left:3px'><span>"+this.prepare_list.data[i].name+"</span></td>";
				tdHtml+= "<td style='padding-left:3px'><span>"+this.prepare_list.data[i].account_bank+"</span></td>";
				tdHtml+= "<td style='padding-left:3px'><span>"+this.prepare_list.data[i].account_holder+"</span></td>";
				tdHtml+= "<td style='padding-left:3px'><span>"+this.prepare_list.data[i].account_no+"</span></td>";
				tdHtml+= "<td style='text-align:right;'><span>" +number_format(this.prepare_list.data[i].money) + "</span></td>";
				tdHtml+= "<td style='text-align:left;'><span>" + this.prepare_list.data[i].sumName + "</span><span style='padding-left:7px;float:right'>" +
					"<button class='btn btn-default list_btn' onclick='selBill2(this)'><i class='icon-pencil'></i></button>" +
					"<button class='btn btn-default list_btn' onclick='_del2(this)'><i class='icon-trash'></i></button></span></td>";
				trHtml += tdHtml;
				trHtml += "</tr>";
				$("#innerTable").append(trHtml);
			}
			else
			{
                tdHtml+= "<td style='text-align:right;'><span style='padding-right:7px'>" +	this.prepare_list.data[i].acntName + "</span></td>";
				tdHtml+= "<td style='text-align:right;'><span style='padding-right:7px'>" +	number_format(this.prepare_list.data[i].money) + "</span></td>";
				tdHtml+= "<td style='text-align:left;'><span style='padding-left:5px'>" + this.prepare_list.data[i].sumName + "</span><span style='padding-left:7px;float:right'>" +
				"<button class='btn btn-default list_btn' onclick='selBill2(this);'><i class='icon-pencil'></i></button>" +
				"<button class='btn btn-default list_btn' onclick='_del2(this);'><i class='icon-trash'></i></button></span></td>";
				trHtml += tdHtml;
				trHtml += "</tr>";
				$("#inputBox3 .innerTable").append(trHtml);
			}
			
	
		}
		
		tempBillList = this.prepare_list;
	}
	,submit : function(resultURL){
		if($("#acntName").val() == "" && $("#btn_save").val() != '3'){
			MessageBox.alert("계정과목을 선택해주세요");
			return;
		}
		if($("#btn_save").val()==2 && modify_flag == "income"){
			this.saveTempBillList();
		}
		else if($("#btn_save").val()==2 && modify_flag != "income"){
			this.modifyTempBillList();
		}
		else if($("#innerTable tr").length == 0 && $("#btn_save").val()==1){
			MessageBox.alert('청구서 항목을 입력 후 등록해주세요');
			return false;
		}
			

		var sub_date =  $("#date2");
		if($(".expend_type").find(".active input").val() == '가지급금'){
			if(sub_date.val().split(" ").join("")=='' || sub_date.val().split(" ").join("")==0 ) {
				sub_date.focus();
				return false;
			}
		}


		var confirmMsg = "입력하신 항목을 청구서로 등록 하시겠습니까?";
		var confirmMsg2 = "전표를 입력 후에 등록 가능합니다.";
		var confirmMsg3 = "입금 받을 계좌번호, 부서명 입력 하지 않고 등록하시겠습니까? 추가 입력을 원하시면 취소를 눌러주세요.";


		if(expend_edit.copy_mode == 1){
			var confirmMsg4 = "청구서를 제출 하시겠습니까?";
		}else{
			var confirmMsg4 = "청구서를 수정 하시겠습니까?";
		}



		if(this.modify_no != 0) {
			if($('.expend_type .active input').val() == '가지급대체' && this.modify_no > 0){
				var diffMoney = sumMoney();


				if(diffMoney == 0){
					if(confirm(confirmMsg4)){
						modify_submit2(tempBillList,CDVList.expend_code, resultURL);
						sumMoney();
						$('#checkAll').prop('checked', false);	
					}
				}else if(diffMoney > 0){
					//추가금
					$('#replaceModalMsg1').text('최초 청구금액보다 입력한 금액이 많아 추가금액이 존재합니다.');
					$('#replaceModalMsg2').text('추가금액을 지급받을 계좌 정보를 입력 해 주세요.');
					$('#replaceModalWithdrawAccount').hide();
					$('#replaceModalAccount').show();
					$('#replaceModalMsg3').text('계좌를 확인하신 후에 청구서 등록 및 인쇄 버튼을 클릭하면 청구서가 등록됩니다.');

					$('#replaceModalMsg4').html('추가청구금액 : ' + number_format(diffMoney) + '원');
					$('#replaceModal').modal('show');
				}else{
					//반환금
					$('#replaceModalMsg1').text('최초 청구금액보다 입력한 금액이 적어 '+ number_format(-diffMoney) + '원의 반환금액이 존재합니다.');
					$('#replaceModalMsg2').text('반환금을 교회 계좌로 반환하시려면 잔금반환 버튼을, 남은 가지급금을 이월하시려면 잔금이월 버튼을 눌러주세요');

					$('#replaceModalWithdrawAccount').show();
					$('#replaceModalAccount').hide();
					
					$('#replaceModalMsg4').html(withdraw_bank + ' ' + withdraw_account + '<br/> 예금주 : 할렐루야교회 <br/> ' + number_format(-diffMoney) + '원');
					$('#replaceModalMsg3').text(' 선택하신 반환/이월을후에 청구서 등록 및 인쇄 버튼을 클릭하면 청구서가 등록됩니다.');
					$('#replaceModal').modal('show');
				}
			}else{
				if(confirm(confirmMsg4)){
					modify_submit2(tempBillList,CDVList.expend_code, resultURL);
					sumMoney();
					$('#checkAll').prop('checked', false);	
				}			
			}				
		}
		else if($('.expend_type .active input').val() == '가지급대체' && this.count_no > 0){
			var diffMoney = sumMoney();
			if(diffMoney == 0){
				 replaceSubmit();
			}else if(diffMoney > 0){
				//추가금
				$('#replaceModalMsg1').text('최초 청구금액보다 입력한 금액이 많아 추가금액이 존재합니다.');
				$('#replaceModalMsg2').text('추가금액을 지급받을 계좌 정보를 입력 해 주세요.');
				$('#replaceModalWithdrawAccount').hide();
				$('#replaceModalAccount').show();
				$('#replaceModalMsg3').text('계좌를 확인하신 후에 청구서 등록 및 인쇄 버튼을 클릭하면 청구서가 등록됩니다.');
				$('#replaceModalMsg4').html('추가청구금액 : ' + number_format(diffMoney) + '원');
				$('#replaceModal').modal('show');

			}else{
				//반환금
				$('#replaceModalMsg1').text('최초 청구금액보다 입력한 금액이 적어 '+ number_format(-diffMoney) + '원의 반환금액이 존재합니다.');
				$('#replaceModalMsg2').text('반환금을 교회 계좌로 반환하시려면 잔금반환 버튼을, 남은 가지급금을 이월하시려면 잔금이월 버튼을 눌러주세요');

				$('#replaceModalWithdrawAccount').show();
				$('#replaceModalAccount').hide();
				
				$('#replaceModalMsg4').html(withdraw_bank + ' ' + withdraw_account + '<br/> 예금주 : 할렐루야교회 <br/> ' + number_format(-diffMoney) + '원');
				$('#replaceModalMsg3').text(' 선택하신 반환/이월을후에 청구서 등록 및 인쇄 버튼을 클릭하면 청구서가 등록됩니다.');
				$('#replaceModal').modal('show');
				
			}
			
		}
		else if(this.modify_no == 0 && this.count_no > 0){		
			if($('#bankID').val() > 0 && $("#account_no").val() == ''){
				if($("#btn_save").val() != '3')
				{
					if(confirm(confirmMsg3)){			
						_submit2(tempBillList, resultURL);
						sumMoney();		
					}
					else{					
						$("#uName").focus();
					}
				}
				else
				{
					_submit2(tempBillList, resultURL);
					sumMoney();	
				}
			}else if(this.count_no == 0){
							
				alert(confirmMsg2);				
				return;
				
			}else{
				if(confirm(confirmMsg)){
					_submit2(tempBillList, resultURL);
					sumMoney();
					$('#checkAll').prop('checked', false);	
				}			
			}				
				
		}
		
	}
	
};

function sel_list(trID){
	
	unsel_list();
	var count_no = $("#innerTable2").find("tr").index($("#"+trID));
	$("#"+trID).addClass('overtest');

	selectRow = count_no;
}

function unsel_list(){
	
	var trObj =  $("#innerTable2").find("tr").get(selectRow);
		
	if(trObj!=''){
		$(trObj).removeClass("overtest");
		selectRow = null;
	}
}

var billList = {
		// 선택 항목 보기 기본 세팅
		add_list : new Array()
		,code_list : new Array()

			/*
			*데이타를 가지고 tr html 를 만들어냄
			* @param : json	전표 데이타를 가지고 있음.
			* @return : String	tr 의 내용 html.
			*/
			,makeBillTr : function (param){

//	        var id = param.billDate.replace("-").join("")+param.no;
//			param.trclass = typeof(param.trclass) == 'undefined' ? '' : param.trclass;

			var id = 'expend_list_'+param.expend_code;
			var tdHtml = {};
			var trHtml = "<tr id = 'expend_list_"+param.expend_code+"' code='"+param.expend_code+"' no='"+param.no+"' flag='"+param.account_option+"' billDate='"+param.billDate+"'  onclick='sel_list(\""+id+"\")'>";
			param.money = number_format(param.money);
			if( param.expend_sub_type == null) {
				param.expend_sub_type = "";
			}else { 
				param.expend_sub_type = param.expend_sub_type;
			} 
			if(param.expend_type == '가지급금' && param.expend_type != null ){
				param.schedule_date = param.schedule_date;
			}else{
				param.schedule_date = '';
			}

			if(param.expend_type == '가지급대체'){
				var list_money = param.money + " <span class='real_money'>(" + number_format(param.sub_money)+")</span>";
			}else{
				var list_money = param.money;
			}

			tdHtml	= "<td class='chk'><input type='checkbox' name='chk[]' value='' hidefocus='true' chkGroup='only' expend_code='"+param.expend_code+ "'no='"+param.no+ "'move_flag='"+param.move_flag+"'  onclick='checkBill(this)'></td>";
			tdHtml	+= "<td><span style='padding-left:3px'>" + param.move_flag + "</span></td>";
			tdHtml	+= "<td><span style='padding-left:3px;color:#4374D9' class='click_point'  code="+param.expend_code+" onclick='view_popup(this);'>" + param.expend_code + "</span></td>";

			if(churchCode == 1199 || churchCode== 4726 || churchCode== 6011){
				if(param.expend_type == null){
					var expend_type= '';
				}else{
					var expend_type= param.expend_type +"("+param.cnt+" )";
				}
				if(param.acntName == null){
					var acntName = '';
				}else{
					var acntName = param.cnt > 1 ? param.acntName  + " 외 "+(param.cnt-1)+"건" : param.acntName;
				}
				if(param.upperName == null){
					var upperName = '';
				}else{
					var upperName = param.upperName+"<br>";
				}

				var summary_str = typeof(param.summary) == 'string' ? param.summary.substring(0,8) : '';
				//console.dir(param.summary + " :::: " + typeof(param.summary) + " :::" + summary_str);
				var summary = param.cnt > 1 ? summary_str + " 외 "+(param.cnt-1)+"건" : summary_str;

				tdHtml	+= "<td><span class='click_point' style='padding-left:3px; color:#4374D9;'code="+param.expend_code+" onclick='view_popup(this);'>" + expend_type + "</span></td>";
				tdHtml	+= "<td style='text-align:center;'><span>" + param.proposal_department + "</span></td>";
				tdHtml	+= "<td style='text-align:center;'><span>" + param.proposer + "</span></td>";
				tdHtml	+= "<td>"+upperName+"<span class='click_point' style='padding-left:3px; color:#4374D9;'code="+param.expend_code+" onclick='view_popup(this);'>" + acntName + "</span></td>";
				tdHtml	+= "<td style='text-align:left;'>" + summary + "</td>";

			}else{

				tdHtml	+= "<td><span class='click_point' style='padding-left:3px; color:#4374D9;'code="+param.expend_code+" onclick='view_popup(this);'>" + param.expend_type +"("+param.cnt+" )" + "</span></td>";
				if(churchCode != 3241 && churchCode != 539){
					tdHtml	+= "<td style='text-align:center;'><span>" + param.proposal_department + "</span></td>";
					tdHtml	+= "<td style='text-align:center;'><span>" + param.proposer + "</span></td>";
				} else {
					tdHtml	+= "<td style='text-align:center;'><span>" + param.name + "</span></td>";
				}
				tdHtml	+= "<td style='text-align:center;' class='acntNameTd'><span>" +param.expend_sub_type+ "</span></td>";
			}
			
			if(param.registrant === null){
				param.registrant = '';
			}
			tdHtml	+= "<td style='text-align:right;'><span>" + list_money + "</span></td>";
			tdHtml	+= "<td style='text-align:center;'><span>" + param.registrant + "</span></td>";
			tdHtml	+= "<td style='text-align:center;'><span>" + param.billDate + "</span></td>";
			if(churchCode == 1199 || churchCode== 4726 || churchCode== 6011){
			
			}else{
				if(param.schedule_over == 'over'){
					tdHtml	+= "<td style='text-align:center;background:red;color:white'><span>" + param.schedule_date + "</span></td>";
					//setBrowsHeight('inputBox2',230+set_brows_size_gap);
					//$("#schedule_date_over").show();
					
				}else{
					tdHtml	+= "<td style='text-align:center;'><span>" + param.schedule_date + "</span></td>";
				}
				
				if( param.balance_payment === null) {
					
					 param.balance_payment = '';
				}
				tdHtml	+= "<td style='text-align:center;'><span>" + param.balance_payment + "</span></td>";
			}
			
			
			tdHtml	+= "<td style='text-align:center;'><span>" + param.regiDate + "</span></td>";
		   	if(churchCode == 4726){
			   tdHtml	+= "<td class='text_divide' style='text-align:center;'><span title='"+param.return_reason+"'>" + param.return_reason + "</span></td>";
			}
			tdHtml	+= "<td style='text-align:center;'><span>" + param.bill_billDate + "</span></td>";
			tdHtml	+= "<td style='text-align:left;' class='acntNameTd'><span></span></td>";

			trHtml += tdHtml;
			trHtml += "</tr>";
			return trHtml;
		}

		,getBillList : function (check){
			
			var self = this;

			$.post("/bill/tempBill/ajaxGetList/" + start + "/" + end + "/" + cutFlag , search_data(check), function(reData) {
				
				if(chkPeriod==1){
					data = chkReturn(reData);
					chkPeriod = 0;
				}else{
					data = chkReturn2(reData);
				}

				if(data=="false"){
					self.unLoading();
					return false;
				}
				
				var billList = eval("(" + data + ")");
				//$("#schedule_date_over").hide();
				
				var trArr = new Array();
				for(var index in billList) {
					if(index == "arrayIndex")
						continue;

					trArr.push( self.makeBillTr(billList[index]));
				}
				
				var appendHtml = trArr.join("");
				
				
				if(billList.length != 0) {
					$("#innerTable2").append(appendHtml);

					if(billList.length < '<?=$rowsPerPage;?>') {
						self.ending();
					}
				} else {
					self.ending();
				}
				self.unLoading();
			});
			
			cutFlag++;
		}

			/*
			* 전표 정보 (합계,갯수)를 리턴하는 ajax 함수입니다.
			*/
		,getBillInfo : function(check) {
			$.post("/bill/tempBill/ajaxGetInfo/" + nAcntYear + "/" + start + "/" + end , search_data(check), function(reData) {
				
				data = chkReturn2(reData);

				if(data=="false"){
					return false;
				}

				var billInfo = eval("(" + data + ")");
							
				
				$("#sum_01").html(billInfo.sum);
				$("#num_01").html(billInfo.num+" 건");
				//$("#sum2_01").html(billInfo[2].sum);
	/*
				var cha = number_format(Math.abs(Number(billInfo[1].sum.split(",").join(""))-Number(billInfo[2].sum.split(",").join(""))));
				$('#sumResultText2').html("[차액 : "+cha+"]");*/

			});
		}
			/*
			* 더이상 출력될 데이터가 없을 때 호출되는 함수입니다.
			*/
		,ending : function () {
			isEnd = true;
			//$("#noneDataMsg").fadeIn("slow");
			sAlert("더 이상 데이터가 없습니다");

		}
			/*
			* 전표 리스트 로딩을 마치는 함수입니다.
			*/
		,unLoading : function () {
			isLoading = false;
			//$("#loadingMsgBox").stop().fadeOut();
			$.unblockUI();
			//sumMoney();	// 목록이 항상 다 출력된것이 아니므로 목록 뿌려줄때 합계 다시내면 안됨
			$('#selectMem').val(0);
		}
	}

//페이지 로딩 이후 리스트를 뿌려져야할 상황이면 ajaxController를 호출합니다.
//뿌려지지 말아야 할 상황 : 최상단 '전표입력' 메뉴를 클릭했을 때
//뿌려져야 할 상황 : 이번주, 지난주, 1분기, 2분기, 조회 등 직접적인 데이터를 호출했을 때
$(function() {
	if($("#listFlag").val() != 0) {
		loading();
	}

});

//스크롤이 맨 밑으로 내려갔을 때 ajaxController를 호출합니다.
$("#inputBox2").scroll(function() {
	// 스크롤이 70% 이상 내려갔을 때 && 데이터가 로딩중이지 않을 때 && 데이터가 끝이 아닐 때
	if(($("#inputBox2").scrollTop() > ($("#innerTable2").height() - $("#inputBox2").height()) * 0.7) && isLoading == false && isEnd == false && tabMenu==2) {
		loading($("#schedule_over").val());
	}
});

function search_data(check){
	var expend_drop = new Array();
	
	$("#expend_type_select").find('input').each(function(){	
		if($(this).prop('checked')== true)
			expend_drop.push('"'+$(this).val()+'"');
	});
	
	var date_type = $(".date_type").find(".active input").val();
	
	var sc_proposal_department = "";
	var sc_proposer = "";
	var sc_name = "";
	var sc_registrant_name = "";
	var search_option = $("#search_option").val();
	var sc_all;
	if(search_option == "all"){
		sc_all = 1;
		sc_proposal_department = $("#search_value").val();
		sc_proposer = $("#search_value").val();
		sc_name = $("#search_value").val();
		sc_registrant_name = $("#search_value").val();
	}
	else if(search_option == "proposal_department"){
		sc_all = 0;
		sc_proposal_department = $("#search_value").val();
	}
	else if(search_option == "proposer"){
		sc_all = 0;
		sc_proposer = $("#search_value").val();
	}
	else if(search_option == "name"){
		sc_all = 0;
		sc_name = $("#search_value").val();
	}
	else if(search_option == "registrant_name"){
		sc_all = 0;
		sc_registrant_name = $("#search_value").val();
	}
	var sc_acnt_name = $("#sc_acnt_name").val();
	var sc_sumname = $("#sc_sumname").val();
	var state_drop = $("#state_drop").val();
	var sc_money = $("#sc_money").val();
	
	if(check){
		var data = { sc_all : sc_all,
				 sc_proposal_department : sc_proposal_department,
				 sc_proposer : sc_proposer,
				 sc_name : sc_name,
				 sc_registrant_name : sc_registrant_name,
				 sc_acnt_name : sc_acnt_name,
				 sc_sumname : sc_sumname,
				 orderName : orderName,
				 expend_state : state_drop,
				 expend_type : expend_drop,
				 sc_money : sc_money,
				 schedule_over:check,
				 date_type:date_type
		};
	}else{
		var data = { sc_all : sc_all,
				 sc_proposal_department : sc_proposal_department,
				 sc_proposer : sc_proposer,
				 sc_name : sc_name,
				 sc_registrant_name : sc_registrant_name,
				 sc_acnt_name : sc_acnt_name,
				 sc_sumname : sc_sumname,
				 orderName : orderName,
				 expend_state : state_drop,
				 expend_type : expend_drop,
				 sc_money : sc_money,
				 date_type:date_type
				 
		};
	}
	
	
	
	return data;
}

function get_expend_list() {
	
	var chk = document.getElementsByName("chk[]");
	var printList = new Array();
	
	var flag_list = new Array();
	
 	var delRows = new Array();
 	
	var cnt = 0;
	
	for(var i = 0; i < chk.length; i++) {
		if(chk[i].checked == true) {

			printList.push(chk[i].parentNode.parentNode.getAttribute('code'));
			cnt++;
		}
	}

	if(cnt == 0) {
		alert("출력할 전표를 선택해주세요");
		return;
	}

	var str = printList.join("n");
	return str;
}

function view_popup2(obj){
	
//	var code = obj.getAttribute('code');
	$("#list").val(obj);
	$("#print_flag").val(2);
	$("#notice").css('display','block');

	var pop_no = Math.floor(Math.random() * 100) + 1;
	
	window.open("", "print_win"+pop_no, "left=10, top=10, width=785px,height=800,scrollbars=yes,resizable=yes");

	$("#printExpendForm").attr("action", "/bill/tempBill/temp_expendPrint");
	$("#printExpendForm").attr("target", "print_win"+pop_no);
	$("#temp_expend_code").val();
	$("#printExpendForm").submit();
	
}

function view_popup(obj){
	
	var code = obj.getAttribute('code');

	$("#list").val(code);
	$("#print_flag").val(2);
	$("#notice").css('display','block');

	var pop_no = Math.floor(Math.random() * 100) + 1;
	
	window.open("", "print_win"+pop_no, "left=10, top=10, width=785px,height=800,scrollbars=yes,resizable=yes");

	$("#printExpendForm").attr("action", "/bill/tempBill/temp_expendPrint");
	$("#printExpendForm").attr("target", "print_win"+pop_no);
	$("#temp_expend_code").val();
	$("#printExpendForm").submit();
	
}

function go_menu(no){
	var accountAndBank = $("#innerTable2 tr[code="+no+"]").attr("flag");
	
	if(typeof parent.tabMenuController == 'undefined'){
		if (writeForm != undefined && writeForm == '1') {
			if(no == 'income' || no == 'undefined' ||  no == ''){
				WindowLocation.href = '/bill/tempBill/bill_write/income?print_mode=2';
			} else {
				WindowLocation.href = '/bill/tempBill/bill_write/'+no+"?print_mode=2";
			}
		} else {
			if(no == 'income' || no == 'undefined' ||  no == ''){
				if(accountAndBank == 1){
					WindowLocation.href = '/bill/tempBill/bill_write/income?print_mode=1';
				}
				else{
					WindowLocation.href = '/bill/tempBill/bill_write/income?print_mode=1';
				}
			}
			else{
				if(accountAndBank == 1){
					WindowLocation.href = '/bill/tempBill/bill_write/'+no+"?print_mode=1";
				}
				else{
					WindowLocation.href = '/bill/tempBill/bill_write/'+no+"?print_mode=4";
				}
			}
		}
	}
	else{
		//여기서 프린트모드를 알아야 한다!!!! flag 1인 녀석이 프린트코드1
		if (writeForm != undefined && writeForm == '1') {
			if(no == 'income' || no == 'undefined' ||  no == ''){
				parent.tabMenuController.moveTabAndURL("재정청구서 입력","/bill/tempBill/bill_write/income?print_mode=2");
			} else {
				parent.tabMenuController.moveTabAndURL("재정청구서 입력","/bill/tempBill/bill_write/"+no+"?print_mode=2");
			}
		} else {
			if(no == 'income' || no == 'undefined' ||  no == ''){
				if(accountAndBank == 1){
					parent.tabMenuController.moveTabAndURL("재정청구서 계정고정 입력","/bill/tempBill/bill_write/income?print_mode=1");
				}
				else{
					parent.tabMenuController.moveTabAndURL("재정청구서 계좌고정 입력","/bill/tempBill/bill_write/income?print_mode=4");
				}
			}
			else{
				if(accountAndBank == 1){
					parent.tabMenuController.moveTabAndURL("재정청구서 계정고정 입력","/bill/tempBill/bill_write/"+no+"?print_mode=1");
				}
				else{
					parent.tabMenuController.moveTabAndURL("재정청구서 계좌고정 입력","/bill/tempBill/bill_write/"+no+"?print_mode=4");
				}
			}
		}
	}
}

function list_go(){
	if(typeof parent.tabMenuController == 'undefined'){
		WindowLocation.href = '/bill/tempBill/listview/income';
	}
	else{
		parent.tabMenuController.moveTab("재정청구서 목록","toQuery");
	}
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

$('#expend_popup').draggable({ //지출결의서 드래거블
	handle: ".top_bar"
});

function printExpendBoxOpen(){
	var inputBox = $('#inputBox2');
	var box = $('#expend_popup');
	var client = {width : document.documentElement.clientWidth, height : document.documentElement.clientHeight};
	var height = inputBox.height();
	var width = inputBox.width();
	var min = {top : inputBox.offset().top, left : 10};
	if(width > client.width){
		width = client.width;
	}
	if(height > client.height){
		height = client.height;
	}
	var offset = {top : Math.floor(height/2), left: Math.floor(width/2)};
	offset.top -= Math.floor(box.height()/2);
	offset.left -= Math.floor(box.width()/2);
	if(offset.top < min.top){
		offset.top = min.top;
	}
	if(offset.left < min.left){
		offset.left = min.left;
	}
	box.css('top', offset.top).css('left', offset.left).show();
}

function printExpendBoxClose(){
	$('#expend_popup').hide();
}

function printExpendBoxPrint(flag){
	
	var str = get_expend_list();
	
	if(typeof(str) == 'undefined') {
		alert("출력할 결의서를 선택하세요");
		return false;
	}
	/*
	if(str == undefined) {
		alert("결의서를 출력할 전표를 선택해주세요");
		return;
	}
	*/

	$("#list").val(str);
	$("#print_flag").val(flag);

	var pop_no = Math.floor(Math.random() * 100) + 1;
	window.open("", "print_win"+pop_no, "width=820px,height=800,scrollbars=yes,resizable=yes");

	$("#printExpendForm").attr("action", "/bill/tempBill/temp_expendPrint");
	$("#printExpendForm").attr("target", "print_win"+pop_no);
	$("#temp_expend_code").val();
	$("#printExpendForm").submit();

}

//##############################################################전표 인쇄 설정창 관련##############################################################



function chkReturn(reData){
	var l = reData.length;
	var state = reData.substr(0, 1);

	switch(state){
		case '1' :
				return reData.substr(1,l);
		case '2' :
//				alert("회계년도를 벗어났습니다");
				return reData.substr(1,l);
		case '3' :
//				alert(reData.substr(1,l));
				return "false";
	}
}

function chkReturn2(reData){
	var l = reData.length;
	var state = reData.substr(0, 1);

	switch(state){
		case '1' :
				return reData.substr(1,l);
		case '2' :
				return reData.substr(1,l);
		case '3' :
				return "false";
	}
}
