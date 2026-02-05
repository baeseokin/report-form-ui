/*
*	@author		엄태범
*	@writedate	2012.8.9.
*	@선택박스 생성기
*
* 	selectBox 사용시 아래 태그 추가
* 	<div id='selectBox'>
		<div id='selectHead'></div>
		<div id='selectList'></div>
		<div id='selectDescription'></div>
	</div>
*/

var selectBox = {
	list : null										// 선택목록의 데이타
	,selectDataIndex : -1							// 선택된 tr 의 인덱스
	,userKeyValue : ""								// 키보드로 숫자 입력한 것 중 유효한 숫자.
	,trMaxIndex : -1									// 선택목록의 index 중 가장 큰것 . 작은건 당연히 0.
	,numberKeySelectMode : null						// 선택목록에서 숫자키 입력시 선택 목록을 검색해서 갱신할 것인지 선택만 할지.
	,numberAllow : false	
	,selectionState : false
	,pageTr : 7								// 해당 input 의 내용이 변경 되었는지 유무
	,recentInputText : ""
	,init : function(targetObj){
		var self = this;

		$(targetObj).find('input:text').focus(function(){
			//self.resetSelectBox(); // 2012.09.06 : JH: select box 에서 tr 을 제외한 부분(scroll bar 등)을 두번째 클릭했을때 hide 되는 현상때문에 주석처리 - 만약 input 에 focus 가 갔을때 select box 가 초기화 되지 않는다면 여기부터 의심해보세요~
		});
		$(targetObj).find('input:text[sList]').click(function(){
			$(this).triggerHandler('focus');			
			if( self.selectionState == false){				
				// $(this).select();
		 		self.selectionState = true;
		 	}else{
		 		self.selectionState = false;
		 	}			
		})
		.focus(function(){
			if(self.menuPopFlag == false){	// 선택메뉴를 마우스로 클릭해서 포커스가 생겼을 땐 메뉴 표시 안한다.
				self.menuPopFlag = true;
				return false;
			}
			self.makeSelectList(this, null);		// null 대신 this.value 를 넣어주고 싶지만.	전표하나 입력하고 다시 돌아와 항목 선택할 때 사용하기 불편해 진다.			
		})				
		.focusout(function(event){
			if(getUserInfo.ajaxRequest != null) {
				getUserInfo.ajaxRequest.abort()
			}
			if(self.menuPopFlag == false)
				return;

			// input 에 있는 값이 list 의 값 중에 없을때, input 과 hidden 지움 
			var iobj = $(self.inputObj);
			var tempIndex = -1;
			for(i=0; i<self.list.data.length; i++){
				if(iobj.val() == self.list.data[i].name){					
					tempIndex = i;
				}
			}

			if(tempIndex != -1)
				return;
			
			self.selectDataIndex = tempIndex;
			var rFunc = iobj.attr("resultFunc");
			if(rFunc != null){
				var result = eval(rFunc+"(this)");
				$('#selectBox').hide();

			}			
		})
		.on("input keydown compositionupdate compositionend", function(event){
			if(event.type == "keydown") {
				return self.keyDownControl(event.keyCode, event);
			} else {
				//최근 input 에 입력된 값과 compositionend로 발생한 이벤트내에서 확인할 수 있는 input 의 값이 같은 경우엔
				//compositionend로 인핸 input 이벤트로 간주할 수 있음.
				if(self.recentInputText == event.target.value) {
					//최근 입력된 값과 같기때문에 무시되어야 할 타이밍임
					//동시에 compositionend 가 발생되기직전의 input 이벤트는 무시되어야 함
					return;
				} else {
					//최근 입력된 값과 다를 경우 최근 입력된 값을 저장해둠
					self.recentInputText = event.target.value;
					self.textInputControl(event.keyCode, event.originalEvent.isComposing);
				}
			}
		})
		.each(function(){
			if($(this).attr('correct') != 'false'){	// 이건 기본 설정을 correct 는 true 로 해주기 위한 것인데 즉, 선택 목록 중에 나와있는 항목중에 반드시 선택해야 하며 그외의 경우는 없다는 공백으로 만들어 버리겠다는 뜻.
				$(this).attr('correct','true');
			}
		});		
		$(document).mousedown(function(){			// 페이지 어딜 클릭해도 창이 사라진다.
			selectBox.resetSelectBox();
		});

		$('#selectBox').mousedown(function(){		// selectBox 는 클릭했을 때 사라지지 않는다.
			self.menuPopFlag = false;
			self.selectionState = true;
			// self.inputObj.select();
			return false;
		});
	}
	
	,incorrectChk : function(){// 값이 있는데, list 의 값 중에 없을때, input 과 hidden 지움
		var iobj = $(this.inputObj);

	}
		/*
		*	선택된 노드 결정
		*/
	,finalize : function(){
		var iobj = $(this.inputObj);
		this.selectBoxMethod = '';	// 선택박스를 불러오게 한 방법 혹은 변수가 뭐였는지

		
		if(iobj.val()!='' && typeof(this.list.data[this.selectDataIndex]) == 'undefined'){//2012-09-28 inputBox에 value가 없을 땐 resultFunc을 호출. value가 있으면 그대로. iobj.val()!='' && 추가
			return false;
		}
		if( this.selectDataIndex >= 0 ){

			if(typeof(this.list.data[this.selectDataIndex].name) != 'undefined'){
				iobj.val(this.list.data[this.selectDataIndex].name);
			}
			if(typeof(this.list.data[this.selectDataIndex].code) != 'undefined'){ // code 가 존재할 땐 selectNo 에 코드를 넣어준다(계정코드)
				iobj.attr("selectNo",this.list.data[this.selectDataIndex].code);
				iobj.attr("selectNo2", this.list.data[this.selectDataIndex].no);
			}else if(typeof(this.list.data[this.selectDataIndex].no) != 'undefined'){	// 예전 것 다시 선택하게 하기 위해서.
				iobj.attr("selectNo",this.list.data[this.selectDataIndex].no);
			}
			if(typeof(this.list.data[this.selectDataIndex].name) != 'undefined'){	// 예전 것 다시 선택하게 하기 위해서.
				iobj.attr("selectName",this.list.data[this.selectDataIndex].name);
			}
		}
		
		if(this.inputObj.id == 'sumName' && iobj.val() != '' && $('#selectBox:visible').length == 1){
			selectSummary = 1;
		}

		var rFunc = iobj.attr("resultFunc");
		if(rFunc != null){
			var result = eval(rFunc+"(this)");
		}

		iobj.removeAttr('editIng');		
		$('#selectBox').hide();
		
	}	
		/*
		*	키보드 조작에 대한 반응
		*/
	,keyDownControl : function(keyCode, event){
		

		if(!this.numberAllow){	// 숫자입력이 허가 되었을 때는 숫자 선택을 사용하지 않는다.
			// 숫자일 경우 input 에 반영하지 않고 조건에 맞는 검색으로 변경한다.
			if(( keyCode >= 48 && keyCode <=57 ) || (keyCode >= 96 && keyCode <= 105)){	// 숫자 일 경우. 키패드 포함.
			
				if(keyCode >= 96){	keyCode -= 48; }

				if(event.ctrlKey == true && typeof(ctrlKeyAction) != 'undefined'){
					ctrlKeyAction(keyCode);
					return false;
				}			// 구성원 입력모드 변경 하는 단축키를 사용하기 위해 사용. 관련 내용은 getListFunc.js 에 있음.
				this.keyControlNumber(keyCode);

				// return false;

			}else{	// 숫자가 아닐 경우 기존 입력했던 숫자 초기화
				this.userKeyValue = "";
			}

		}


		if( keyCode == KEY.PAGEUP ){								// page up
			if(this.selectDataIndex-this.pageTr <= 0){
				this.choiceTr(0);
			}else{
				this.choiceTr(this.selectDataIndex-this.pageTr);
			}			
			this.scrollTr();
			this.inputObj.select();
			return false;
		}

		if( keyCode == KEY.PAGEDN ){								// page down
			if(this.selectDataIndex+this.pageTr >= this.trMaxIndex){
				this.choiceTr(this.trMaxIndex);
			}else{
				this.choiceTr(this.selectDataIndex + this.pageTr);				
			}
			this.scrollTr();
			this.inputObj.select();			
			return false;
		}


		if(keyCode == KEY.ARROW_UP ){									// 위쪽 화살표
			if(this.selectDataIndex <= 0){				
				this.choiceTr(this.trMaxIndex);								
			}else{				
				this.choiceTr(this.selectDataIndex-1);				
			}			
			this.scrollTr();
			this.inputObj.select();
			return false;
		}

		
		if(keyCode == KEY.ARROW_DN ){									// 아래쪽 화살표.
			if(this.selectDataIndex >= this.trMaxIndex){				
				this.choiceTr(0);			
			}else{				
				this.choiceTr(this.selectDataIndex+1);	
			}
			this.scrollTr();
			this.inputObj.select();
			return false;
		}

		if(keyCode == KEY.ESC ){									// esc 키. 목록초기화

			this.makeSelectList(this.inputObj, "");
			this.inputObj.value = "";
			this.finalize();
			this.inputObj.blur();
			this.inputObj.focus();
			return false;
		}
		
		if(keyCode == KEY.ENTER ){									// 엔터 키
			this.postProcessing(event);
			return false;
		}
		
		if(keyCode == KEY.TAB ){									// 탭 키
			this.postProcessing(event);
		}
	}
		/* 
		*	숫자키가 입력 되었을 때의 컨트롤
		*/
	,keyControlNumber : function( keyCode){
		var inputObj = this.inputObj;
		var self = this;
		var number = String(keyCode - 48);


		var tempNum = this.userKeyValue + number;
		
		var findIndex = this.searchNumberAndContent(tempNum);

		if(findIndex == null){
			tempNum = number;
			findIndex = this.searchNumberAndContent(tempNum);
		}

		this.choiceTr(findIndex);

		this.userKeyValue = tempNum;

		//this.inputObj.select();


	}
	,postProcessing : function (event) {
		if(this.list.needPostProcessing == true && !this.list.isInitialized && this.list.data.length == 1) {
			//오토컴플릿이 초기화가 아직 안되었을때
			//그대로 탭키를 동작시키고 난뒤 입력된 값에대해 후보정 조치를 취함
			if($(event.currentTarget).data("postprocessing") == true) {
				//후보정 조치
				var param = {
					name : event.currentTarget.value,
					memType : 1
				};
				$.ajax({
					type : 'post',
					url : '/sList/memberLegendSearch/1',
					data : param,
					dataType : 'json'
				}).done(function(response) {
					if(response.length > 0) {
						const member = response[0];
						if($("#menu1").hasClass("on")) {
							//입력 상태일 경우
							$("#pid").val(member.no);
							$("#tid").val(member.tid);
							$("#memType").val(1);
							$("#name1Tag").removeClass().addClass("memType1")

						} else if ($("#menu2").hasClass("on")) {
							//조회 상태일 경우
							$("#sc_pid").val(member.no)
						}
						$("#info_name").html(member.name)
						$("#info_birth").html(member.birth)
						$("#info_cellphone").html(member.member_cellphone)
						$("#info_depth2").html(member.depth2_name)
						$("#info_depth3").html(member.depth3_name)
					}
				}).fail(function(response) {
					console.log("post processing is failed", response);
				});
			}
			this.finalize();
		} else {
			//오토컴플릿이 초기화 되었을때
			this.finalize();
		}
	}
	,searchNumberAndContent : function(tempNum){

		var findIndex = null;
		$(this.list.data).each(function(index){
			if(findIndex != null){ return; }

			if(String(this.no).indexOf(tempNum) === 0 || this.name.indexOf(tempNum) != -1){
				findIndex = index;
				return;
			}
		});

		return findIndex;

	}
	,textInputControl : function(keyCode, isComposing){
		if(keyCode == KEY.BACKSPACE) {
			this.userKeyValue = this.inputObj.value;
		} else if( (keyCode != KEY.PAGEUP && keyCode != KEY.PAGEDN && keyCode != KEY.ARROW_UP && keyCode != KEY.ARROW_DN && keyCode != KEY.ARROW_LEFT && keyCode != KEY.ARROW_RIGHT)
			&& !( this.numberAllow != true && (( keyCode >= 48 && keyCode <=57 ) || (keyCode >= 96 && keyCode <= 105)))	// 숫자 입력이 아닌 경우 (숫자 입력 허용일 경우는 제외)
			&& !(keyCode == KEY.ENTER || keyCode== KEY.TAB || keyCode== KEY.ESC || keyCode== KEY.SHIFT || (keyCode >=KEY.PAGEUP && keyCode <=KEY.PAGEDN))	// 엔터, 탭, esc, shift 가 아닐 경우.
			&& (keyCode != 229 || isComposing)
		){
			this.makeSelectList(this.inputObj, this.inputObj.value);
		}

	}
		/*
		*	선택할 목록을 만듦. 
		* @param inputObj		object	input 객체
		* @param value		string	항상 input 의 value로만 검색할 것이 아니라서 값을 넘겨줌.
		*/
	,makeSelectList : function(inputObj, value){



		var jobj = $(inputObj);
		var self = this;
		
		this.resetSelectBox();

		this.menuPopFlag = true;

		jobj.attr('editIng','true');
		this.selectDataIndex = -1;
		this.selectTrLists = null;
		this.userKeyValue = "";
		this.trMaxIndex = -1;
		this.inputObj = inputObj;
		this.changed = false;
		
		var sList = jobj.attr('sList').split(":");
		this.numberAllow = jobj.attr('numberAllow')=="true" ? true : false;
		this.selectBoxMethod = sList[1];	// 선택박스를 불러오게 한 방법 혹은 변수가 뭐였는지 기록


		if(sList[0] == 'data'){	// 리스트 데이타를 변수에서 가져오는 경우.

			var list = this.getListDataFromData(eval(this.selectBoxMethod), value);
			this.insertList(list);
			if(value == null){
				this.autoChoiceBeforeSelect();
			}

		}else{	// function 으로 읽어올 경우.
			var list = this.getListDataFromFunc( eval(this.selectBoxMethod), value);

		}
	}
	,getListDataFromData : function( listVar, value){
		var param = {
			columnName : listVar.columnName
			,data : listVar.data
			,tdWidth : listVar.tdWidth
			,description : listVar.description
		};
		var list = param.data;
		var tmpArr = new Array();
		$(param.data).each(function(){

			// 값이 없거나, 숫자의 앞부분에서 찾거나 , 내용의 일부로서 찾을 경우 목록에 넣음.
			// 지금은 parentAccount 에서 검색이 되도록 해놧는데 이걸 추후 config 값으로 추가 검색이 될수 있도록 하는 필드명을 init 할때 지정할수 있도록 할 생각이다. 190730 엄태범.
			if(typeof(churchCode) != 'undefined' && (churchCode == 5134 || churchCode == 8694)){
				if(value == null || (typeof(this.no) != 'undefined' && String(this.no).indexOf(value) >= 0) || (typeof(this.name) != 'undefined' && this.name.indexOf(value) !== -1 )  ){
					tmpArr.push(this);
				}
			}else{
				if(value == null || (typeof(this.no) != 'undefined' && String(this.no).indexOf(value) >= 0) || (typeof(this.name) != 'undefined' && this.name.indexOf(value) !== -1 ) || (typeof(this.parentAccount) != 'undefined' && this.parentAccount != null && this.parentAccount.indexOf(value) !== -1 ) ){
					tmpArr.push(this);
				}
			}


		});
		param.data = tmpArr;
		
		return param;
	}
	,getListDataFromFunc : function( listVar, value){
		//this.selectBoxMethod = getUserInfo.getuserList;
		//this.list = 번호/봉투/이름/생일/나이/그룹...등 selectBox
		//value = 내가입력한값

		listVar(this, value );	// insertList 함수를 콜백 함수로 해서. 리스트가 만들어진다음. 실행 되도록 함.
		
	}
		/*
		*	목록의 html 을 구성.
		*/
	,makeHtml : function(list){

		var titleTds = new Array();
		var listTrs = new Array();

		var columnHead = $(list.columnName);
		var tdLength = $(list.columnName).length;


		var tTitleHead = new Array();
		var tListHead = new Array();

		var hiddenTd = 0;
		var totalWidth = 1;


		columnHead.each(function(index){
			var width;
			var widthValue = list.tdWidth[index];

			if(widthValue == 0){						// width 가 0 인 것은 표시하지 않는다.
				tdLength--;							// 사용하지 않는 td는 colspan 에서 사용하지 않기 위함.
				hiddenTd++;							// 사용하지 않는 td의 갯수.
				return;
			}

			titleTds.push("<td>"+this+"</td>");			// 컬럼의 제목을 만듦.

			width = "style='width:"+widthValue+"px'";
			tListHead.push("<td "+width+"></td>");		// 컨텐츠에 들어갈 것이므로 정확해야함.
			totalWidth += widthValue;

			//if(index == tdLength-1){
			//	width = "";
			//}
			tTitleHead.push("<td "+width+"></td>");		// 헤드 부분에 스크롤바를 무시해야 하므로 width를 없앰.
		});

		$("#selectBox").css('width',totalWidth);

		$(list.data).each(function(){

			tbodyTds = new Array();
			var colspan = '';
			var tds = this;
			var cols;
			var tdsSize = 0;
			var tdValue;
			var style ='';

			for( i in tds){	tdsSize++;	 };
			cols = tdLength - tdsSize + hiddenTd;

			var index = -1;

			for( i in tds){

				index++;

				if(list.tdWidth[index] == 0){	continue; }				// width 가 0 인 것은 표시하지 않는다.

				tdValue = tds[i] == null ? '' : tds[i];

				colspan = (index+1 == tdsSize && cols > 0) ?  'colspan = "'+(cols+2)+'"' : '';
				
				// 마지막 td에만 colspan 이 들어간다.
				tbodyTds.push("<td "+colspan+">"+tdValue+"</td>");
			}

			// 전표 입력에서 계정코드별로 배경색을 구분하기 위하여 추가	@승준 2014-09-11
			if(typeof(tds['parentAccount']) != 'undefined' || (typeof(tds['code']) != 'undefined' && typeof(tds['depth']) != 'undefined')){
				if(tds['code'] < 20000000000) style = "style='background:#fffff0;'";
				else if(tds['code'] < 30000000000) style = "style='background:#EBF7FF;'";
				else if(tds['code'] < 40000000000) style = "style='background:#F6F6F6;'";
				else if(tds['code'] < 50000000000) style = "style='background:#f5fffa;'";
				else if(tds['code'] < 60000000000) style = "style='background:#fffaf0;'";
			}
				
			// 계정코드와 같이 depth를 필요로 하는 것들이 있을까 싶어서. 미리 준비 해둠.
			if(typeof(tds['depth']) != 'undefined'){
				var depthClass = "depth"+tds['depth'];
			}

			listTrs.push("<tr class='"+depthClass+"'"+style+">"+tbodyTds.join("")+"</tr>");

		});

		return tableHTML={
			head : "<table class='thead'><thead><tr>"+tTitleHead.join("")+"</tr></thead><tbody><tr>"+titleTds.join("")+"</tr></tbody></table>"
			,body : "<table class='tbody'><thead><tr>"+tListHead.join("")+"</tr></thead><tbody>"+listTrs.join("")+"</tbody></table>"
		};

	}
	
	,getIndexFromSelectNo : function(selectNo){
		var indexNo = null;
		for(var i=0;i<this.list.data.length;i++) {
			if(this.list.data[i].no == selectNo) {
				indexNo = i;
				break;
			}
		}
		return indexNo;

	}
	/*
	*	원래 입력했던 값이 있으면 그것을 선택 해 준다.
	*/
	,autoChoiceBeforeSelect : function(){
		var jobj = $(this.inputObj);

		// 기존에 선택된 값이 있을 경우 
		var selectNo = $.trim(jobj.attr('selectNo'));

		if( typeof(jobj.attr('selectNo')) != 'undefined' && typeof(jobj.attr('selectName')) != 'undefined'  && jobj.attr('selectName') == jobj.val() ){
			// 기존에 선택 된 값이 선택된 상태가 된 상태로 목록이 표시되도록 함.
			var indexNo = this.getIndexFromSelectNo(selectNo);
			//계정과목 오토컴플릿이면서 indexNO를 못찾앗으면
			//hidden 에 박혀있던 코드값으로 한번 더 찾아줌
			if(indexNo == null && jobj.attr('id') == 'acntName'){
				selectNo = jobj.attr('selectNo2');
				indexNo = this.getIndexFromSelectNo(selectNo);
			}
			this.choiceTr(indexNo);
			this.scrollTr();
		}

	}
	/*
	*	구해온 정보를 이용해 선택 목록 테이블을 만들고 기본 선택 값이 있으면 선택 해 준다.
	*/
	,insertList : function(list,autoIndex,selectMethod){

		//alert("insertList call..");

		var self = this;
		this.list = list;
		
		// selectMetohd 는 기본으로 null 이나, ajax로 리스트 가져올때 현재 포커스 되어있는 객체와 같을 때만 띄워준다.
		// 그 외에는 무시. 이미 떠난 배다.
		if(!(selectMethod == null || this.selectBoxMethod == selectMethod) ){
			return false;
		}

		var tableHTML = this.makeHtml( this.list );
		
		$('#selectHead').html(tableHTML.head);
		$('#selectList').html(tableHTML.body);
		$('#selectDescription').html("<div>"+this.list.description+"</div>");
		this.setPosition(this.inputObj);
		$('#selectBox').show();


		this.selectTrLists = $('#selectList tbody tr');
		this.trMaxIndex = this.selectTrLists.length-1;


		this.selectTrLists.mouseover(function(){
			var index = this.rowIndex;
			self.choiceTr(index-1);
		});
			
		this.selectTrLists.click(function(){
			var index = this.rowIndex;
			self.choiceTr(index-1);
			self.finalize();

			// self.inputObj.select();
			self.selectionState = true;

			return false;
		});

		var iobj = $(this.inputObj);
		
	
		// 내용이 무조건 선택박스에서 선택한 것과 일치 해야하고 입력한 내용이 있을 경우. 첫번째 것 또는 지정된 것(autoIndex) 를 선택한 상태로 목록이 시작된다.

		if( $.trim(iobj.val()) != "" && this.trMaxIndex > -1 ){	


			if(autoIndex>-1){
				this.choiceTr(autoIndex);
			}else if( iobj.attr('correct') == 'true' ){
				this.choiceTr(0);
			}

		}else if($.trim(iobj.val()) == "" && typeof(this.list.data[0]) != 'undefined' && typeof(this.list.data[0].name) != 'undefined' && this.list.data[0].name == ""){
			this.choiceTr(0);
		}else if($.trim(iobj.val()) == "" && typeof(this.list.data[0]) != 'undefined'){
			setTimeout(function(){
				$('#selectList').get(0).scrollTop=0;
			},10);

		}

		return true;

	}
	/*
	*	선택 된 tr에 선택 되었다는 표시를 함.
	*/
	,choiceTr : function(index){	 
		var tr;

		// 기존에 선택된 상태를 해제 시킴.
		if( this.selectDataIndex != -1){
			tr = this.selectTrLists.get(this.selectDataIndex);
			$(tr).removeClass('over');
		}

		// 새로운 선택에 대한 지정
		if( index != null && index >= 0){			
			this.selectDataIndex = index;
			tr = this.selectTrLists.get(this.selectDataIndex);
			$(tr).addClass("over");
		}else{
			this.selectDataIndex = -1;
		}

		//$(this.inputObj).removeAttr('loadingStatus');	// 이름 리스트 받아올 때만(getListfunc.js) 사용하는 것인데. 입력값이 결정되면 없애준다.
	}
	/*
	*	키보드로 화살표,PAGE UP/DOWN 키로 이동할때, SCROLL 동작 처리 - MOUSE 일때는 MOUSER OVER 와 WHEEL SCROLL 사이의 간섭때문에 사용하지 않는다. -
	*/
	,scrollTr : function(){

		tr = this.selectTrLists.get( this.selectDataIndex );
		if(tr !== undefined) {
			$('#selectList').get(0).scrollTop = parseInt(tr.offsetTop)-100;
		}

	}
	/*
	*	선택 박스의 위치를 잡아줌.
	*/
	,setPosition : function(inputObj){

		var obj = $(inputObj);
		var height = parseInt(inputObj.offsetHeight);

		var absObj = inputObj.getBoundingClientRect();
		//var top = getAbsPos.getTop(inputObj);
		var top = absObj.top;
		var left;

		//Add
		var objId = inputObj.id;
		if(objId == "popName" || objId == "acntName" ||objId == "determinator_name") {
			var offset = $("#" + objId).offset();
			left = offset.left;

		} else{
			//left = getAbsPos.getLeft(inputObj);
			left = absObj.left;
		}

		var overWidth = left + $('#selectBox').width() - $(window).width();	// 오른쪽 뚫고 나가려는 애들 바로 잡기.
		left = overWidth > 0 ? left - overWidth : left;
		var topPosition = top+height;

		if($(document).height() - topPosition < $('#selectBox').height()) {
			topPosition -= ($('#selectBox').height() + $(inputObj).height() * 4);
		}
		$('#selectBox').css('top',topPosition);
		$('#selectBox').css('left',left);
	}
	/*
	* 선택박스의 값을 초기화 함.
	*/
	,resetSelectBox : function(){
		$('#selectBox').hide();
		$('#selectHead').html("");
		$('#selectList').html("");
		$('#selectDescription').html("");

	}


};

/*
* 절대위치 구하는 모듈.
*/
var getAbsPos = {
	noRecur : 0
	,getTop : function (obj,flag){
		if(flag!=true){
			this.noRecur = 0;
		}
		this.noRecur++;
		var offsetParent = $(obj.offsetParent);

		if(this.noRecur>10){
			return obj.offsetTop;
		}
		if(offsetParent.length == 0 || offsetParent.attr('tagName') == 'BODY' || offsetParent.attr('tagName') == 'HTML' || !obj.offsetParent.tagName || offsetParent.css('position')=='relative' || offsetParent.css('position') == 'absolute' ){

			var top1 = isNaN(parseInt(obj.style.top))?0:parseInt(obj.style.top);
			var top2 = isNaN(parseInt(offsetParent.css('top')))?0:parseInt(offsetParent.css('top'));
			a = obj.offsetTop-top1+top2;
			return a;
		}else{
			getT = this.getTop(obj.offsetParent,true);
			
			return getT+obj.offsetTop-obj.scrollTop;

		}
	}
	,getLeft : function (obj,flag){
		if(flag!=true){
			this.noRecur = 0;
		}
		this.noRecur++;
		var offsetParent = $(obj.offsetParent);
		if(this.noRecur>10){
			return obj.offsetLeft;
		}
	

		if(offsetParent.length == 0 || offsetParent.attr('tagName') == 'BODY' || offsetParent.attr('tagName') == 'HTML' || !obj.offsetParent.tagName || offsetParent.css('position')=='relative' || offsetParent.css('position') == 'absolute' ){
			return obj.offsetLeft-obj.scrollLeft;
		}else{
			return this.getLeft(obj.offsetParent,true)+obj.offsetLeft-obj.scrollLeft;
		}

	}

};

var KEY = {
	SHIFT			: 16
	,CTRL			: 17
	,ENTER			: 13
	,ALT				: 18
	,BACKSPACE		: 8
	,TAB				: 9
	,ESC				: 27
	,SPACE			: 32
	,PAGEUP			: 33
	,PAGEDN			: 34
	,END				: 35
	,HOME			: 36
	,ARROW_LEFT		: 37
	,ARROW_UP		: 38
	,ARROW_RIGHT	: 39
	,ARROW_DN		: 40
	,DELETE		: 46
	,NUM_SLASHES	: 111
	,NUM_ASTERISK	: 106
	,NUM_MINUS		: 109
};
