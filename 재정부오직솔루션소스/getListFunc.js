const TRANS_BASE_INCOME = 1;
const TRANS_BASE_EXPENSE = 2;
const TRANS_INCOME_EXPENSE = [1, 2];
const TRANS_BASE_DEBIT = 3;
const TRANS_BASE_CREDIT = 4;
const TRANS_DEPOSIT_DEBIT = 73;
const TRANS_DEPOSIT_CREDIT = 74;
const TRANS_DEPOSIT_ALL = [73, 74];
const TRANS_WITHDRAW_DEBIT = 83;
const TRANS_WITHDRAW_CREDIT = 84;
const TRANS_WITHDRAW_ALL = [83, 84];
const TRANS_DEPOSIT_WITHDRAW = [73, 74, 83, 84];
const TRANS_DEBIT_CREDIT = [3, 4];
const TRANS_ALL_DEBIT_CREDIT = [3, 4, 73, 74, 83, 84];
const TRANS_ALL_DEBIT = [3, 73, 83];
const TRANS_ALL_CREDIT = [4, 74, 84];
const TRANS_F_INCOME_EXPENSE = [1, 2, 5, 6];
const TRANS_B_INCOME_EXPENSE = [11, 12, 15, 16];
const TRANS_LEFT_DISP_MONEY = [2, 3, 6, 73, 83];	// 차변에 금액 표기
const TRANS_RIGHT_DISP_MONEY = [1, 4, 5, 74, 84];	// 대변에 금액 표기
const DEFAULT_BANK_ID_CASH = 0;
const DEFAULT_BANK_NAME_CASH = '현금';

const checkTransType = function (expr, transType) {

	if (typeof (transType) == 'string') {
		transType = parseInt(transType);
	}
	if (isNaN(transType)) {
		return false;
	}

	if (typeof (expr) == 'object') {

		if (expr.indexOf(transType) > -1) {
			return true;
		}
	} else if (typeof (expr) == 'string' || typeof (expr) == 'number') {
		if (typeof (expr) == 'string') {
			expr = parseInt(expr);
		}
		if (expr === transType) {
			return true;
		}
	}
	return false;

}

/*
* 성도정보를 가져옴. 전표입력에서 사용
*/

var getUserInfo = {
	ticket: null
	, param: null
	, columnInfo: {
		//여기서 [0] 에 있는 "번호" 는 pid
		1: ["교적ID" ,"재정ID", "봉투<br>번호", "이름", "직분", "생년월일", "배우자", "소속1", "소속2", "소속3", "핸드폰", "자녀이름", "tid", "zipcode", "zipcode", "", "", "주소", "", "", "", ""]
		,2 : ["재정ID","봉투<br>번호","","거래처명","연락처","사업자번호","대표자명","은행","계좌번호","예금주"]
		,3 : ["재정ID","봉투<br>번호","","구역명","구역장 성명","전화번호","상세설명"]
		,0 : ["교적ID" ,"재정ID","-","-","성명","상세설명"]
		,4 : ["교적ID" ,"재정ID","","교회","","", "목사","","지방회","메모","","","","","","","","","","","","메모"]
	}
	/*
	*	각 컬럼의 width 값 지정. 값이 0이면 width =0 으로 하지 않고 아예 td를 생성 하지 않아 버림.
	*/
	,columnWidth : {
		1 :		[40,40,40,80,80,110,80,80,80,80,100,130,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
		, 2 :	[40,40,0,80,110,50,70,100,80,0,0,0,0]
		, 3 :	[40,40,0,80,80,100,250]
		,0 :	[0,0,0,0,80,450]
		,4 :	[50,50,0,100,0,0,100,0,100,0,0,0,0,0,0,0,0,0,0,0,0,300]

	}

	,description : {
		1 : "헌금봉투번호 또는 헌금자 이름을 입력 해주세요.<br><br>이름을 [<span class='bold'>이름@구역명</span>] 으-로 입력하시면 해당 구역 성도를 검색합니다.<br><span class='example'>예시)홍길동@1구역  또는 김바울@유아부</span><br>이름을 [<span class='bold'>이름#생년월일</span>] 으로 입력하시면 해당 생일자 성도를 검색합니다.<br><span class='example'>예시)홍길동#650201 또는 김순자#780201 (생년월일은 650102 와 같이 6자리 숫자로 입력해 주세요.)</span>"
		,2 : "봉투번호나 거래처 이름을 입력 해주세요"
		,3 : "봉투번호나 구역명을 입력 해 주세요"
		,0 : "아이디를 생성하지 않고 무아이디로 입력합니다. (신원 확인이 안되거나 1회성 헌금에 대해서 입력)"
		,4 : ""

	}

	,getUserList : function (selectBoxObj){

		var self = getUserInfo;							// 자기 자신을 this 로 참조 하지 못해서 억지로 self 로 참조하도록 함.
		self.selectBoxObj = selectBoxObj;					// selectBox 객체
		self.selectBoxMethod = self.selectBoxObj.selectBoxMethod;	// 현재의 메쏘드 정보를 저장한다.	당연히 getUserInfo.getUserList 겠지.

		var searchValue = selectBoxObj.inputObj.value;	// 원래 이 메쏘드에 2번째 argument로 searchValue 를 넘겨주지만 이름검색은 그것을 사용하면 포커스가 갔을 때 null 값이 넘어오므로 목록이 생기지 않는다.
		self.searchValue = searchValue==null ? "" : searchValue;

		var memType = $('.memTypeRadio:checked').val();

		getUserInfo.targetType = $(selectBoxObj.inputObj).attr("targetType") || false;
		var searchTarget = $(selectBoxObj.inputObj).data('search-target') || 'all';

		if(memType==null){
			if (churchCode == 4046) {
				memType = 1;
			} else {
				memType = 2;
			}
		}

		if(churchCode == 5814){
			self.columnInfo[1] = ["교적ID" ,"번호","","이름","상세","생년월일", "배우자","핸드폰","소속1","소속2","소속3","자녀이름","tid","zipcode","zipcode","","","주소","","","",""];
			self.columnWidth[1] = [40, 40,50,70,40,110,80,90,80,80,0,130,0,0,0,0,0,230,0,0,0,0,0];
		}else if(churchCode == 6011){
			self.columnInfo[1] = ["교적ID" ,"번호","봉투<br>번호","이름","직분","생년월일", "배우자","소속1","소속2","소속3","핸드폰","전화번호","자녀이름","tid","zipcode","zipcode","","","주소","","","",""];
			self.columnWidth[1] = [40, 40,40,80,80,75,80,80,80,80,100,90,130,0,0,0,0,0,0,0,0,0,0,0];
		}

		self.name = searchValue;
		self.ssn1 = searchValue;
		self.p_grade_name = null;
		self.groupName = null;
		self.birthDate = null;
		self.age = null;

		var birthYear = null;
		var birthDay = null;
		var age = null;

		if(searchValue.indexOf("@") != -1){				// 구역에 대한 정보 파싱

			var tmp = searchValue.split("@");
			self.name = tmp[0];
			self.groupName = tmp[1];

		}else if(searchValue.indexOf("#") != -1){		// 생일에 대한 정보 파싱

			var tmp = searchValue.split("#");
			self.name = tmp[0];
			if(String(tmp[1]).length >= 2 && String(tmp[1]).length <= 6){	// 2글짜에서 6글짜 사이여야 검색 시작.
				self.birthDate = tmp[1];
				var tmpYear = self.birthDate.substr(0,2);
				birthYear = tmpYear > 13 ? '19'+tmpYear : '20'+tmpYear;
				var tmpDay = self.birthDate.substr(2,4);
				birthDay = tmpDay.length == 4 ? tmpDay : null;

				var nowDate = new Date();
				var nowYear =nowDate.getYear();
				self.age = nowYear - birthYear + 1;
			}
		}


		self.param = {
			name : self.name
			,ssn1 : self.ssn1
			,p_grade_name : self.p_grade_name
			,groupName : self.groupName
			,birthYear: birthYear
			,birthDay: birthDay
			,memType : memType
			,searchTarget: searchTarget
		};

		self.preLoading();	 // 미리 검색창을 띄워 놓아서 사용자를 기다리지 않게 한다.

		if(churchCode == 5814){
			$('#selectBox').css({
				top:0
				,left:'auto'
				,right:0
			});
		}
		clearTimeout(self.ticket);

		if(name == "" || searchValue=="" || searchValue == null){ return; }	// 입력 값이 없으면 이대로 종료.
		// 0.02 초 이내로 타이핑이 이루어 질 경우 반복해서 호출하지 않도록. 시간차를 줌.

		if(!(self.name >= 0) && self.name.length < 2){
			self.preLoading('두 글자 이상 입력시 검색이 시작됩니다');
			return;
		}
		if(/[ㄱ-ㅎ]/.exec(self.name)){
			// 초성만 입력된 부분이 있다면 이름검색을 하지 않도록.
			self.preLoading(self.name);
			return;
		}

		//$(self.selectBoxObj.inputObj).attr('loadingStatus','true');

		self.ticket = setTimeout("getUserInfo.getPost()",140);

		$(selectBoxObj.inputObj).unbind('blur',self.blur);	// blur 효과가 중복으로 발생되서 그거 방지하기 위해 unbind 를 건다.
		$(selectBoxObj.inputObj).blur(self.blur);

	}
	/*
	*	포커스가 다른 input 으로 이동했음에도 불구하고 뒤늦게 뜨는 것을 방지하기 위함.
	*/
	,blur : function(){

		var self = getUserInfo;
		clearTimeout(self.ticket);
		$(self.selectBoxObj.inputObj).unbind('blur',self.blur);

	}
	,getPost : function(){
		var self = getUserInfo;

		if(self.ajaxRequest && self.ajaxRequest instanceof Object)
			self.ajaxRequest.abort();

		self.ajaxRequest = $.ajax({
			'type':'post',
			'url':'/sList/memberLegendSearch',
			'data':self.param,
			'dataType':'json'
		}).done(function(getListData){
			var listData = [];
			var autoIndex = 0;	// 자동 선택 되는 row 의 index 를 지정.
			var targetOption = (getUserInfo.targetType === "member") ? false : true;

			var lists = $(getListData);

			if(lists.length == 0){
				listData.push({message : "검색 결과가 없습니다."});
				autoIndex = 1;
			} else if(lists.length != 0 && id_option != 0 ){
				autoIndex = 1;
			}else {
				autoIndex = 0;
			}

			lists.each(function(){
				var birthDate = this.birth;
				if (churchCode == 5814) {
					var year = String(this.birth).substr(0, 4);
					var current_year = new Date().getFullYear();
					var age = year > 1900 && year < 2100 ? '[' + String(current_year - Number(year) + 1) + ']' : '';
					birthDate = birthDate + ' ' + age;
					this.p_grade_name = '<a href="#" onclick="clickName(event,\'' + this.tid + '\')">정보</a>';
					var image = this.member_image == null || this.member_image == '' ? '/images/noimg.png' : s3Path +'/userFiles/zz' + churchCode + '/' + this.member_image;
					this.env = '<div style="background-image:url(\'' + image + '\');background-size:cover;background-position:center center;" class="profile_img">';

					var obj = {
						tid : this.data,
						no: this.no, //pid
						env: this.env,
						name: this.name,
						p_grade_name: this.p_grade_name,
						birth: birthDate,
						partner_name: this.partner_name,
						member_cellphone: this.member_cellphone,
						depth2_name: this.depth2_name,
						depth3_name: this.depth3_name,
						depth4_name: this.depth4_name,
						children: this.children,
						tid: this.tid, //tid
						zipcode: this.zipcode,
						zipcode2: this.zipcode2,
						rrn_id1: this.rrn_id1,
						rrn_id2: this.rrn_id2,
						addr: this.addr,
						addr2: this.addr2,
						member_sex: this.member_sex,
						donation_name: this.donation_name,
						etc: this.etc,
						member_image: this.member_image
					};
					listData.push(obj);
				}else if(churchCode == 6011) {

					var obj = {
						tid: this.tid,
						no: this.no,
						env: this.env,
						name: this.name,
						p_grade_name: this.p_grade_name,
						birth: birthDate,
						partner_name: this.partner_name,
						depth2_name: this.depth2_name,
						depth3_name: this.depth3_name,
						depth4_name: this.depth4_name,
						member_cellphone: this.member_cellphone,
						member_phone: this.member_phone,
						children: this.children,
						zipcode: this.zipcode,
						zipcode2: this.zipcode2,
						rrn_id1: this.rrn_id1,
						rrn_id2: this.rrn_id2,
						addr: this.addr,
						addr2: this.addr2,
						member_sex: this.member_sex,
						donation_name: this.donation_name,
						etc: this.etc,
						member_image: this.member_image
					};
					listData.push(obj);
				}else{
					this.birth = birthDate;
					listData.push(this);
				}

			});
			if(self.param.memType == 1 && churchCode != 5814){
				if (churchCode == 4046) {
					listData.push({tid:"New", no:"New",envNo:"New",name:self.name, blank1: '', blank2: '',  description : "새 아이디 발급 (기존에 재정에 입력한 적이 없을 경우 새로 아이디 추가)"});
					if(typeof(id_option) != 'undefined' && id_option == 0 && targetOption){
						listData.push({tid:"New", no:"0",envNo:"",name:self.name, blank1: '', blank2: '', description : "무 아이디로 입력 (신원 확인이 안되거나 1회성 입력일 경우 선택)"});
					}
				} else {
					listData.push({tid:"New",no:"New",envNo:"New",name:self.name,  description : "새 아이디 발급 (기존에 재정에 입력한 적이 없을 경우 새로 아이디 추가)"});
					if(typeof(id_option) != 'undefined' && id_option == 0 && targetOption){
						listData.push({tid:"New",no:"0",envNo:"",name:self.name, description : "무 아이디로 입력 (신원 확인이 안되거나 1회성 입력일 경우 선택)"});
					}
				}
			} else if (self.param.memType == 2 || self.param.memType == 3) {
				listData.push({tid:"New",no:"New",envNo:"New",pid:"",name:self.name,  description : "새 아이디 발급 (기존에 재정에 입력한 적이 없을 경우 새로 아이디 추가)"});
				if(typeof(id_option) != 'undefined' && id_option == 0 && targetOption){
					listData.push({tid:"New",no:"0",envNo:"",pid:"",name:self.name, description : "무 아이디로 입력 (신원 확인이 안되거나 1회성 입력일 경우 선택)"});
				}
			}
			var columnIdx = self.param.memType;

			if (churchCode == 4046 && columnIdx == 1) {
				columnIdx = 4;
			}
			var param = {
				columnName : self.columnInfo[columnIdx]
				,data : listData
				,tdWidth : self.columnWidth[columnIdx]
				,description : self.description[columnIdx]
			};

			if(typeof(description_option) != 'undefined' && description_option == 1){
				param.description = '';
			}

			if(churchCode == 5814){
				autoIndex = 0;
			}

			// 기본 파라미터, 자동선택 index, 현재 객체(포커스 이동 후 창 띄우지 않기 위해)
			if( self.selectBoxObj.insertList(param,autoIndex,self.selectBoxMethod) == true ){
				self.selectBoxObj.autoChoiceBeforeSelect();	// 그 이전에 선택했던 것 다시 선택.
			}

			if(churchCode == 5814){
				$('#selectBox').css({
					top:0
					,left:'auto'
					,right:0
				});
			}

		});
	}


	/*
	*	ajax로 불러오기 전에 표시 해주어야 할 것들.
	*/
	,preLoading : function(message){
		var self = getUserInfo;
		var autoIndex = null;

		var listData = [];

		if(message != null) {
			listData.push({message : message});
		}else if(self.name == ""){
			//listData.push({message : "봉투번호 또는 이름을 입력 해 주세요. (아래의 설명을 참조 해주세요)"});
		}else{
			if(typeof(id_option) != 'undefined' && id_option == 0){
//				listData.push({no:"0",envNo:"",tid:"",name:self.name, description : "무 아이디로 입력 (신원 확인이 안되거나 1회성 입력일 경우 선택)"});
			}
			if(typeof(new_option) != 'undefined' && new_option == 0){
				/*			if(self.param.memType == 1){
								listData.push({no:"New",envNo:"New",tid:"",name:self.name, ssn1 : self.ssn1, p_grade_name : "", group_name : self.groupName, birth:self.birthDate, birthYear : "", birthDay : "", age : self.age, description : "새 아이디 발급 (기존에 재정에 입력한 적이 없을 경우 새로 아이디 추가)"});
								autoIndex = 1;
							}else if(self.param.memType != 0){
								listData.push({no:"New",envNo:"New",tid:"",name:self.name,  description : "새 아이디 발급 (기존에 재정에 입력한 적이 없을 경우 새로 아이디 추가)"});
								autoIndex = 1;
							}*/
			}

			listData.push({message : "조회 중...<img src='/images/loading.gif' style='width:16px;vertical-align:middle;'/>"});
		}

		var columnIdx = self.param.memType;

		if (churchCode == 4046 && columnIdx == 1) {
			columnIdx = 4;
		}

		var param = {
			columnName : self.columnInfo[columnIdx]
			,data : listData
			,tdWidth : self.columnWidth[columnIdx]
			,description : self.description[columnIdx]
			,isInitialized : false
			,needPostProcessing : true
		};

		if(typeof(description_option) != 'undefined' && description_option == 1){
			param.description = '';
		}

		self.selectBoxObj.insertList(param);

	}
};

var getUserInfo3 ={
	ticket : null
	,param : null
	,columnInfo : {
		1 : ["번호","봉투<br>번호","이름","직분","생년월일", "배우자","세대","교구","구역","핸드폰","자녀이름","","","","","","","","",""]
		,2 : ["번호","봉투<br>번호","","거래처명","연락처","사업자번호","대표자명","은행","계좌번호","예금주"]
		,3 : ["번호","봉투<br>번호","","구역명","구역장 성명","전화번호","상세설명"]
		,0 : ["번호","-","-","성명","상세설명"]
		,4 : ["번호","","교회","","", "목사","","지방회","메모","","","","","","","","","","","","메모","",""]
		,5 : ["번호","","타입","교회","","전화번호"]
		,6 : ["번호","봉투<br>번호","","타입","이름","","전화번호"]
	}
	/*
	*	각 컬럼의 width 값 지정. 값이 0이면 width =0 으로 하지 않고 아예 td를 생성 하지 않아 버림.
	*/
	,columnWidth : {
		1 :		[40,40,80,80,100,80,80,80,80,100,120,0,0,0,0,0,0,0,0,0]
		, 2 :	[40,40,80,80,110,50,70,100,80,0,0,0,0]
		, 3 :	[40,40,0,80,80,100,250]
		,0 :	[0,0,0,80,450]
		,4 :	[50,0,100,0,0,100,0,100,0,0,0,0,0,0,0,0,0,0,0,0,300,0,0]
		,5 :	[50,0,100,100,0,300]
		,6 :	[50,40,0,100,100,0,300]
	}

	,description : {
		1 : "헌금봉투번호 또는 헌금자 이름을 입력 해주세요.<br><br>이름을 [<span class='bold'>이름@구역명</span>] 으로 입력하시면 해당 구역 성도를 검색합니다.<br><span class='example'>예시)홍길동@1구역  또는 김바울@유아부</span><br>이름을 [<span class='bold'>이름#생년월일</span>] 으로 입력하시면 해당 생일자 성도를 검색합니다.<br><span class='example'>예시)홍길동#650201 또는 김순자#780201 (생년월일은 650102 와 같이 6자리 숫자로 입력해 주세요.)</span>"
		,2 : "봉투번호나 거래처 이름을 입력 해주세요"
		,3 : "봉투번호나 구역명을 입력 해 주세요"
		,0 : "아이디를 생성하지 않고 무아이디로 입력합니다. (신원 확인이 안되거나 1회성 헌금에 대해서 입력)"
		,4 : ""
		,5 : ""
		,6 : ""
	}

	,getUserList : function (selectBoxObj){
		var self = getUserInfo3;							// 자기 자신을 this 로 참조 하지 못해서 억지로 self 로 참조하도록 함.
		self.selectBoxObj = selectBoxObj;					// selectBox 객체
		self.selectBoxMethod = self.selectBoxObj.selectBoxMethod;	// 현재의 메쏘드 정보를 저장한다.	당연히 getUserInfo.getUserList 겠지.

		var searchValue = selectBoxObj.inputObj.value;	// 원래 이 메쏘드에 2번째 argument로 searchValue 를 넘겨주지만 이름검색은 그것을 사용하면 포커스가 갔을 때 null 값이 넘어오므로 목록이 생기지 않는다.
		self.searchValue = searchValue==null ? "" : searchValue;

		var sc_memType0 = $(".sc_memType[value=0]").is(':checked');
		var sc_memType1 = $(".sc_memType[value=1]").is(':checked');
		var sc_memType2 = $(".sc_memType[value=2]").is(':checked');
		var sc_memType3 = $(".sc_memType[value=3]").is(':checked');

		var memType = null;
		self.targetType = $(selectBoxObj.inputObj).attr("targetType") || false;

		if(memType==null){
			if (churchCode == 4046) {
				memType = 4;
			} else {
				memType = 6;
			}
		}

		self.name = searchValue;
		self.ssn1 = searchValue;

		self.param = {
			name : self.name
			,ssn1 : self.ssn1
			,sc_memType1 : sc_memType1
			,sc_memType2 : sc_memType2
			,sc_memType3 : sc_memType3
			,memType : memType
		};

		self.preLoading();	 // 미리 검색창을 띄워 놓아서 사용자를 기다리지 않게 한다.

		if(name == "" || searchValue=="" || searchValue == null){ return; }	// 입력 값이 없으면 이대로 종료.

		// 0.02 초 이내로 타이핑이 이루어 질 경우 반복해서 호출하지 않도록. 시간차를 줌.
		clearTimeout(self.ticket);

		self.ticket = setTimeout("getUserInfo3.getPost()",140);

		$(selectBoxObj.inputObj).unbind('blur',self.blur);	// blur 효과가 중복으로 발생되서 그거 방지하기 위해 unbind 를 건다.
		$(selectBoxObj.inputObj).blur(self.blur);
	}
	/*
	*	포커스가 다른 input 으로 이동했음에도 불구하고 뒤늦게 뜨는 것을 방지하기 위함.
	*/
	,blur : function(){
		var self = getUserInfo3;
		clearTimeout(self.ticket);
		$(self.selectBoxObj.inputObj).unbind('blur',self.blur);
	}
	,getPost : function(){
		var self = getUserInfo3;

		if(self.ajaxRequest && self.ajaxRequest instanceof Object)
			self.ajaxRequest.abort();

		self.ajaxRequest = $.ajax({
			'type':'post',
			'url':'/sList/multiMemTypeSearch',
			'data':self.param,
			'dataType':'json'
		}).done(function(getListData){
			var listData = [];
			var autoIndex = 0;	// 자동 선택 되는 row 의 index 를 지정.
			var targetOption = (self.targetType === "member") ? false : true;
			var lists = $(getListData);
			listData.push({message : "일반텍스트를 입력합니다."});
			lists.each(function(){
				listData.push(this);
			});

			var columnIdx = self.param.memType;


			if (churchCode == 4046 && columnIdx == 1) {
				columnIdx = 4;
			}

			var param = {
				columnName : self.columnInfo[columnIdx]
				,data : listData
				,tdWidth : self.columnWidth[columnIdx]
				,description : self.description[columnIdx]
			};

			if(typeof(description_option) != 'undefined' && description_option == 1){
				param.description = '';
			}

			// 기본 파라미터, 자동선택 index, 현재 객체(포커스 이동 후 창 띄우지 않기 위해)

			if( self.selectBoxObj.insertList(param,autoIndex,self.selectBoxMethod) == true ){
				self.selectBoxObj.autoChoiceBeforeSelect();	// 그 이전에 선택했던 것 다시 선택.
			}

		});
	}

	/*
	*	ajax로 불러오기 전에 표시 해주어야 할 것들.
	*/
	,preLoading : function(){
		var self = getUserInfo3;
		var autoIndex = null;

		var listData = [];

		if(self.name == ""){
		}else{
			listData.push({message : "조회 중...<img src='/images/loading.gif' style='width:16px;vertical-align:middle;'/>"});
		}

		var columnIdx = self.param.memType;

		if (churchCode == 4046 && columnIdx == 1) {
			columnIdx = 4;
		}

		var param = {
			columnName : self.columnInfo[columnIdx]
			,data : listData
			,tdWidth : self.columnWidth[columnIdx]
			,description : self.description[columnIdx]
		};

		if(typeof(description_option) != 'undefined' && description_option == 1){
			param.description = '';
		}

		self.selectBoxObj.insertList(param);
	}
}


var getUserInfo4 ={
	ticket : null
	,param : null
	,columnInfo : {
		//2 : ["번호","청구자명","연락처","은행","계좌번호","예금주"]
		2 : ["번호","봉투<br>번호","","수령자명","연락처","사업자번호","대표자명","은행","계좌번호","예금주"]
	}
	/*
	*	각 컬럼의 width 값 지정. 값이 0이면 width =0 으로 하지 않고 아예 td를 생성 하지 않아 버림.
	*/
	,columnWidth : {
		2 : [40,0,0,80,100,0,0,100,110,80,0,0,0,0]
	}

	,description : {

		2 : "이름을 입력 해주세요"


	}

	,getUserList : function (selectBoxObj){

		var self = getUserInfo4;							// 자기 자신을 this 로 참조 하지 못해서 억지로 self 로 참조하도록 함.
		self.selectBoxObj = selectBoxObj;					// selectBox 객체
		self.selectBoxMethod = self.selectBoxObj.selectBoxMethod;	// 현재의 메쏘드 정보를 저장한다.	당연히 getUserInfo.getUserList 겠지.

		var searchValue = selectBoxObj.inputObj.value;	// 원래 이 메쏘드에 2번째 argument로 searchValue 를 넘겨주지만 이름검색은 그것을 사용하면 포커스가 갔을 때 null 값이 넘어오므로 목록이 생기지 않는다.
		self.searchValue = searchValue==null ? "" : searchValue;

		var memType =2;

		self.name = searchValue;
		self.ssn1 = searchValue;
		self.p_grade_name = null;
		self.groupName = null;
		self.birthDate = null;
		self.age = null;

		var birthYear = null;
		var birthDay = null;
		var age = null;

		if(searchValue.indexOf("@") != -1){				// 구역에 대한 정보 파싱

			var tmp = searchValue.split("@");
			self.name = tmp[0];
			self.groupName = tmp[1];

		}else if(searchValue.indexOf("#") != -1){		// 생일에 대한 정보 파싱

			var tmp = searchValue.split("#");
			self.name = tmp[0];
			if(String(tmp[1]).length >= 2 && String(tmp[1]).length <= 6){	// 2글짜에서 6글짜 사이여야 검색 시작.
				self.birthDate = tmp[1];
				var tmpYear = self.birthDate.substr(0,2);
				birthYear = tmpYear > 13 ? '19'+tmpYear : '20'+tmpYear;
				var tmpDay = self.birthDate.substr(2,4);
				birthDay = tmpDay.length == 4 ? tmpDay : null;

				var nowDate = new Date();
				var nowYear =nowDate.getYear();
				self.age = nowYear - birthYear + 1;
			}

		}

		self.param = {
			name : self.name
			,ssn1 : self.ssn1
			,p_grade_name : self.p_grade_name
			,groupName : self.groupName
			,birthYear: birthYear
			,birthDay: birthDay
			,memType : memType

		};

		self.preLoading();	 // 미리 검색창을 띄워 놓아서 사용자를 기다리지 않게 한다.

		if(name == "" || searchValue=="" || searchValue == null){ return; }	// 입력 값이 없으면 이대로 종료.


		if(/[ㄱ-ㅎ]/.exec(self.name)){
			// 초성만 입력된 부분이 있다면 이름검색을 하지 않도록.
			self.preLoading(self.name);
			return;
		}

		// 0.02 초 이내로 타이핑이 이루어 질 경우 반복해서 호출하지 않도록. 시간차를 줌.
		clearTimeout(self.ticket);

		//$(self.selectBoxObj.inputObj).attr('loadingStatus','true');

		self.ticket = setTimeout("getUserInfo4.getPost()",140);

		$(selectBoxObj.inputObj).unbind('blur',self.blur);	// blur 효과가 중복으로 발생되서 그거 방지하기 위해 unbind 를 건다.
		$(selectBoxObj.inputObj).blur(self.blur);

	}
	/*
	*	포커스가 다른 input 으로 이동했음에도 불구하고 뒤늦게 뜨는 것을 방지하기 위함.
	*/
	,blur : function(){

		var self = getUserInfo4;
		clearTimeout(self.ticket);
		$(self.selectBoxObj.inputObj).unbind('blur',self.blur);

	}
	,getPost : function(){
		var self = getUserInfo4;


		$.post('/sList/memberLegendSearch',self.param,function(getListData){
			//$(self.selectBoxObj.inputObj).removeAttr('loadingStatus');

			var listData = [];
			var autoIndex = 0;	// 자동 선택 되는 row 의 index 를 지정.

			if(self.param.memType == 2){
				listData.push({tid : "New", no:"New",envNo:'','':'',name:self.name, description : "새 아이디 발급 (기존에 재정에 입력한 적이 없을 경우 새로 아이디 추가)"});
				autoIndex = 2;
			}

			var lists = $(getListData);

			if(lists.length == 0){
				autoIndex = 1;
				listData.push({message : "검색 결과가 없습니다."});
			}
			lists.each(function(){
				listData.push(this);
			});


			var param = {
				columnName : self.columnInfo[self.param.memType]
				,data : listData
				,tdWidth : self.columnWidth[self.param.memType]
				,description : self.description[self.param.memType]
			};

			if(typeof(description_option) != 'undefined' && description_option == 1){
				param.description = '';
			}


			/*			if(typeof(description_display_flag)!= 'undefined') && description_display_flag == false){
                            param.description = '';
                        }
                        */

			// 기본 파라미터, 자동선택 index, 현재 객체(포커스 이동 후 창 띄우지 않기 위해)

			if( self.selectBoxObj.insertList(param,autoIndex,self.selectBoxMethod) == true ){
				self.selectBoxObj.autoChoiceBeforeSelect();	// 그 이전에 선택했던 것 다시 선택.
			}

		},'json');
	}


	/*
	*	ajax로 불러오기 전에 표시 해주어야 할 것들.
	*/
	,preLoading : function(){
		var self = getUserInfo4;
		var autoIndex = null;

		var listData = [];

		if(self.name == ""){
			//listData.push({message : "봉투번호 또는 이름을 입력 해 주세요. (아래의 설명을 참조 해주세요)"});
		}else{

			listData.push({message : "조회 중...<img src='/images/loading.gif' style='width:16px;vertical-align:middle;'/>"});
		}

		var param = {
			columnName : self.columnInfo[self.param.memType]
			,data : listData
			,tdWidth : self.columnWidth[self.param.memType]
			,description : self.description[self.param.memType]
		};

		if(typeof(description_option) != 'undefined' && description_option == 1){
			param.description = '';
		}

		self.selectBoxObj.insertList(param);

	}
}


/*
* 성도/거래처 등록에서...
*/
var getUserInfo2 ={
	ticket : null
	,param : null
	,columnInfo : {
		1 : ["번호","봉투<br>번호","이름","직분","생년월일","배우자","세대","교구","구역","핸드폰","자녀이름","","","","","","주소1","주소2","성별","","",""]
	}
	/*
	*	각 컬럼의 width 값 지정. 값이 0이면 width =0 으로 하지 않고 아예 td를 생성 하지 않아 버림.
	*/
	,columnWidth : {
		1 : [40,0,90,60,100,80,80,80,80,100,110,0,0,0,0,0,150,150,0,0,0,0]

	}
	,description : {
		1 : "헌금봉투번호 또는 헌금자 이름을 입력 해주세요.<br><br>이름을 [<span class='bold'>이름@구역명</span>] 으로 입력하시면 해당 구역 성도를 검색합니다.<br><span class='example'>예시)홍길동@1구역  또는 김바울@유아부</span><br>이름을 [<span class='bold'>이름#생년월일</span>] 으로 입력하시면 해당 생일자 성도를 검색합니다.<br><span class='example'>예시)홍길동#650201 또는 김순자#780201 (생년월일은 650102 와 같이 6자리 숫자로 입력해 주세요.)</span>"

	}
	,getUserList : function (selectBoxObj){
		var self = getUserInfo2;							// 자기 자신을 this 로 참조 하지 못해서 억지로 self 로 참조하도록 함.
		self.selectBoxObj = selectBoxObj;					// selectBox 객체
		self.selectBoxMethod = self.selectBoxObj.selectBoxMethod;	// 현재의 메쏘드 정보를 저장한다.	당연히 getUserInfo.getUserList 겠지.

		var searchValue = selectBoxObj.inputObj.value;	// 원래 이 메쏘드에 2번째 argument로 searchValue 를 넘겨주지만 이름검색은 그것을 사용하면 포커스가 갔을 때 null 값이 넘어오므로 목록이 생기지 않는다.
		self.searchValue = searchValue==null ? "" : searchValue;

		var memType = $('.memTypeRadio:checked').val();

		self.name = searchValue;
		self.groupName = "";
		self.birthDate = "";
		self.age = "";

		var birthYear = "";
		var birthDay = "";
		var age = "";

		if(searchValue.indexOf("@") != -1){				// 구역에 대한 정보 파싱

			var tmp = searchValue.split("@");
			self.name = tmp[0];
			self.groupName = tmp[1];

		}else if(searchValue.indexOf("#") != -1){		// 생일에 대한 정보 파싱

			var tmp = searchValue.split("#");
			self.name = tmp[0];
			if(String(tmp[1]).length >= 2 && String(tmp[1]).length <= 6){	// 2글짜에서 6글짜 사이여야 검색 시작.
				self.birthDate = tmp[1];
				var tmpYear = self.birthDate.substr(0,2);
				birthYear = tmpYear > 13 ? '19'+tmpYear : '20'+tmpYear;
				var tmpDay = self.birthDate.substr(2,4);
				birthDay = tmpDay.length == 4 ? tmpDay : null;

				var nowDate = new Date();
				var nowYear =nowDate.getYear();
				self.age = nowYear - birthYear + 1;
			}

		}

		self.param = {
			name : self.name
			,groupName : self.groupName
			,birthYear: birthYear
			,birthDay: birthDay
			,memType : memType
		};


		self.preLoading();	 // 미리 검색창을 띄워 놓아서 사용자를 기다리지 않게 한다.

		if(name == "" || searchValue=="" || searchValue == null){ return; }	// 입력 값이 없으면 이대로 종료.


		if(/[ㄱ-ㅎ]/.exec(self.name)){
			// 초성만 입력된 부분이 있다면 이름검색을 하지 않도록.
			self.preLoading(self.name);
			return;
		}
		// 0.02 초 이내로 타이핑이 이루어 질 경우 반복해서 호출하지 않도록. 시간차를 줌.
		clearTimeout(self.ticket);

		//$(self.selectBoxObj.inputObj).attr('loadingStatus','true');

		self.ticket = setTimeout("getUserInfo2.getPost()",140);

		$(selectBoxObj.inputObj).unbind('blur',self.blur);	// blur 효과가 중복으로 발생되서 그거 방지하기 위해 unbind 를 건다.
		$(selectBoxObj.inputObj).blur(self.blur);

	}
	/*
	*	포커스가 다른 input 으로 이동했음에도 불구하고 뒤늦게 뜨는 것을 방지하기 위함.
	*/
	,blur : function(){

		var self = getUserInfo2;
		clearTimeout(self.ticket);
		$(self.selectBoxObj.inputObj).unbind('blur',self.blur);

	}
	,getPost : function(){
		var self = getUserInfo2;

		$.post('/sList/memberLegendSearch',self.param,function(getListData){
			//$(self.selectBoxObj.inputObj).removeAttr('loadingStatus');

			var listData = [];
			var autoIndex = 0;	// 자동 선택 되는 row 의 index 를 지정.

			if(self.param.memType == 1){
				listData.push({no:"New",envNo:"New",name:self.name, birth:self.birthDate, birthYear : "", birthDay : "", description : "새 아이디 발급 (기존에 재정에 입력한 적이 없을 경우 새로 아이디 추가)"});
				autoIndex = 2;
			}else if(self.param.memType != 0){
				listData.push({no:"New",envNo:"New",tid:"",name:self.name,  description : "새 아이디 발급 (기존에 재정에 입력한 적이 없을 경우 새로 아이디 추가)"});
				autoIndex = 2;
			}

			var lists = $(getListData);

			if(lists.length == 0){
				autoIndex = 0;
				listData.push({message : "검색 결과가 없습니다."});
			}
			lists.each(function(){
				listData.push(this);
			});


			var param = {
				columnName : self.columnInfo[self.param.memType]
				,data : listData
				,tdWidth : self.columnWidth[self.param.memType]
				,description : self.description[self.param.memType]
			};

			// 기본 파라미터, 자동선택 index, 현재 객체(포커스 이동 후 창 띄우지 않기 위해)

			if( self.selectBoxObj.insertList(param,autoIndex,self.selectBoxMethod) == true ){
				self.selectBoxObj.autoChoiceBeforeSelect();	// 그 이전에 선택했던 것 다시 선택.
			}

		},'json');
	}
	/*
	*	ajax로 불러오기 전에 표시 해주어야 할 것들.
	*/
	,preLoading : function(){
		var self = getUserInfo2;
		var autoIndex = null;

		var listData = [];

		if(self.name == ""){
			//listData.push({message : "봉투번호 또는 이름을 입력 해 주세요. (아래의 설명을 참조 해주세요)"});
		}else{
			if(self.param.memType == 1){
				listData.push({no:"New",envNo:"New",tid:"",name:self.name, birth:self.birthDate, birthYear : "", birthDay : "", age : self.age, group_name : self.groupName, description : "새 아이디 발급 (기존에 재정에 입력한 적이 없을 경우 새로 아이디 추가)"});
				autoIndex = 2;
			}else if(self.param.memType != 0){
				listData.push({no:"New",envNo:"New",tid:"",name:self.name,  description : "새 아이디 발급 (기존에 재정에 입력한 적이 없을 경우 새로 아이디 추가)"});
				autoIndex = 2;
			}

			listData.push({message : "조회 중...<img src='/images/loading.gif' style='width:16px;vertical-align:middle;'/>"});
		}

		var param = {
			columnName : self.columnInfo[self.param.memType]
			,data : listData
			,tdWidth : self.columnWidth[self.param.memType]
			,description : self.description[self.param.memType]
		};


		self.selectBoxObj.insertList(param);

	}
}


/*
 * 기부금 영수증에서..
*/
var getTaxUserInfo ={
	ticket : null
	,param : null
	,columnInfo : {
//		1 : ["번호","봉투<br>번호","tid","이름","직분","그룹","생일","-","-","나이","배우자","휴대폰","그룹상세정보","주소","생년월일"]
		1 : ["번호","봉투<br>번호","이름","직분","생년월일","배우자","교구","구역","핸드폰","자녀이름","","","","","","주소1","주소2","성별","","",""]
		,2 : ["번호","봉투<br>번호","","거래처명","연락처","사업자번호","대표자명","은행","계좌번호","예금주"]
		,3 : ["번호","봉투<br>번호","","구역명","구역장 성명","전화번호","상세설명"]
		,0 : ["번호","-","-","성명","상세설명"]
	}
	/*
	*	각 컬럼의 width 값 지정. 값이 0이면 width =0 으로 하지 않고 아예 td를 생성 하지 않아 버림.
	*/
	,columnWidth : {
//		1 : [40,40,0,80,50,100,50,0,0,30,80,100,0,250,0]
		1 : [40,0,70,60,100,80,80,80,100,110,0,0,0,0,0,0,0,0,0,0,0,0]
		, 2 : [40,40,0,80,80,110,50,70,100,80]
		, 3 : [40,40,0,80,80,100,250]
		,0 :[0,0,0,80,450]

	}
	,description : {
//		1 : "헌금봉투번호 또는 헌금자 이름을 입력 해주세요.<br><br>이름을 [<span class='bold'>이름@구역명</span>] 으로 입력하시면 해당 구역 성도를 검색합니다.<br><span class='example'>예시)홍길동@1구역  또는 김바울@유아부</span><br>이름을 [<span class='bold'>이름#생년월일</span>] 으로 입력하시면 해당 생일자 성도를 검색합니다.<br><span class='example'>예시)홍길동#650201 또는 김순자#780201 (생년월일은 650102 와 같이 6자리 숫자로 입력해 주세요.)</span>"
		1 : ""
		,2 : "봉투번호나 거래처 이름을 입력 해주세요"
		,3 : "봉투번호나 구역명을 입력 해 주세요"
		,0 : "아이디를 생성하지 않고 무아이디로 입력합니다. (신원 확인이 안되거나 1회성 헌금에 대해서 입력)"

	}
	,getUserList : function (selectBoxObj){

		var self = getTaxUserInfo;							// 자기 자신을 this 로 참조 하지 못해서 억지로 self 로 참조하도록 함.
		self.selectBoxObj = selectBoxObj;					// selectBox 객체
		self.selectBoxMethod = self.selectBoxObj.selectBoxMethod;	// 현재의 메쏘드 정보를 저장한다.	당연히 getUserInfo.getUserList 겠지.

		var searchValue = selectBoxObj.inputObj.value;	// 원래 이 메쏘드에 2번째 argument로 searchValue 를 넘겨주지만 이름검색은 그것을 사용하면 포커스가 갔을 때 null 값이 넘어오므로 목록이 생기지 않는다.
		self.searchValue = searchValue==null ? "" : searchValue;

		var memType = $('.memTypeRadio:checked').val();

		self.name = searchValue;
		self.p_grade_name = '';
		self.groupName = '';
		self.birthDate = '';
		self.age = '';

		var birthYear = '';
		var birthDay = '';
		var age = '';

		if(searchValue.indexOf("@") != -1){				// 구역에 대한 정보 파싱

			var tmp = searchValue.split("@");
			self.name = tmp[0];
			self.groupName = tmp[1];

		}else if(searchValue.indexOf("#") != -1){		// 생일에 대한 정보 파싱

			var tmp = searchValue.split("#");
			self.name = tmp[0];
			if(String(tmp[1]).length >= 2 && String(tmp[1]).length <= 6){	// 2글짜에서 6글짜 사이여야 검색 시작.
				self.birthDate = tmp[1];
				var tmpYear = self.birthDate.substr(0,2);
				birthYear = tmpYear > 13 ? '19'+tmpYear : '20'+tmpYear;
				var tmpDay = self.birthDate.substr(2,4);
				birthDay = tmpDay.length == 4 ? tmpDay : null;

				var nowDate = new Date();
				var nowYear =nowDate.getYear();
				self.age = nowYear - birthYear + 1;
			}

		}

		self.param = {
			name : self.name
			,p_grade_name : self.p_grade_name
			,groupName : self.groupName
			,birthYear: birthYear
			,birthDay: birthDay
			,memType : memType
			,zipcode : self.zipcode
			,zipcode2 : self.zipcode2
			,addr : self.addr
			,addr2 : self.addr2
			,rrn_id1 : self.rrn_id1
			,rrn_id2 : self.rrn_id2
		};

		self.preLoading();	 // 미리 검색창을 띄워 놓아서 사용자를 기다리지 않게 한다.

		if(name == "" || searchValue=="" || searchValue == null){ return; }	// 입력 값이 없으면 이대로 종료.

		if(/[ㄱ-ㅎ]/.exec(self.name)){
			// 초성만 입력된 부분이 있다면 이름검색을 하지 않도록.
			self.preLoading(self.name);
			return;
		}
		// 0.02 초 이내로 타이핑이 이루어 질 경우 반복해서 호출하지 않도록. 시간차를 줌.
		clearTimeout(self.ticket);

		//$(self.selectBoxObj.inputObj).attr('loadingStatus','true');

		self.ticket = setTimeout("getTaxUserInfo.getPost()",70);

		$(selectBoxObj.inputObj).unbind('blur',self.blur);	// blur 효과가 중복으로 발생되서 그거 방지하기 위해 unbind 를 건다.
		$(selectBoxObj.inputObj).blur(self.blur);

	}
	/*
	*	포커스가 다른 input 으로 이동했음에도 불구하고 뒤늦게 뜨는 것을 방지하기 위함.
	*/
	,blur : function(){

		var self = getTaxUserInfo;
		clearTimeout(self.ticket);
		$(self.selectBoxObj.inputObj).unbind('blur',self.blur);

	}
	,getPost : function(){
		var self = getTaxUserInfo;
		if(self.ajaxRequest && self.ajaxRequest instanceof Object)
			self.ajaxRequest.abort();

		self.ajaxRequest = $.ajax({
			'type':'post',
			'url':'/sList/memberLegendSearch',
			'data':self.param,
			'dataType':'json'
		}).done(function(getListData){

			//$(self.selectBoxObj.inputObj).removeAttr('loadingStatus');

			var listData = [];
			var autoIndex = 1;	// 자동 선택 되는 row 의 index 를 지정.

			listData.push({no:"0",envNo:"",tid:"",name:self.name, description : "무 아이디로 입력 (신원 확인이 안되거나 1회성 입력일 경우 선택)"});

			var lists = $(getListData);

			if(lists.length == 0){
				autoIndex = 0;
				listData.push({message : "검색 결과가 없습니다."});
			}
			lists.each(function(){
				listData.push(this);
			});

			var param = {
				columnName : self.columnInfo[self.param.memType]
				,data : listData
				,tdWidth : self.columnWidth[self.param.memType]
//				,description : self.description[self.param.memType]
				,description : ''
			};

			// 기본 파라미터, 자동선택 index, 현재 객체(포커스 이동 후 창 띄우지 않기 위해)
			if( self.selectBoxObj.insertList(param,autoIndex,self.selectBoxMethod) == true ){
				self.selectBoxObj.autoChoiceBeforeSelect();	// 그 이전에 선택했던 것 다시 선택.
			}

		});
	}
	/*
	*	ajax로 불러오기 전에 표시 해주어야 할 것들.
	*/
	,preLoading : function(){

		var self = getTaxUserInfo;
		var autoIndex = 0;

		var listData = [];

		if(self.name == ""){
			listData.push({message : "봉투번호 또는 이름을 입력 해 주세요. (아래의 설명을 참조 해주세요)"});
		}else{
//			listData.push({no:"0",envNo:"",tid:"",name:self.name, description : "무 아이디로 입력 (신원 확인이 안되거나 1회성 입력일 경우 선택)"});
			listData.push({message : "조회 중...<img src='/images/loading.gif' style='width:16px;vertical-align:middle;'/>"});
		}

		var param = {
			columnName : self.columnInfo[self.param.memType]
			,data : listData
			,tdWidth : self.columnWidth[self.param.memType]
			,description : self.description[self.param.memType]
		};

		self.selectBoxObj.insertList(param);

	}
}


/*
* 적요정보를 가져옴.(헌금전표)
*/
var getSummaryInfo ={

	ticket : null
	,param : null
	,getSummaryList : function (selectBoxObj){
		var self = getSummaryInfo;
		self.selectBoxObj = selectBoxObj;
		self.selectBoxMethod = self.selectBoxObj.selectBoxMethod;		// 현재의 메쏘드 정보를 저장한다.	당연히 getSummaryInfo.getSummaryList 겠지.

		var searchValue = $.trim(selectBoxObj.inputObj.value);
		self.searchValue = searchValue;

		var acntCode = $('#acntCodeTemp').val();
		var billDate = $('#date').val();
//		 selectSummary = 1;

		self.preLoading(searchValue);	 // 미리 검색창을 띄워 놓아서 사용자를 기다리지 않게 한다.

		self.param = {
			summary : searchValue
			,acntCode : acntCode
			,billDate : billDate
			,type : 'donation'
		};

		// 0.05 초 이내로 타이핑이 이루어 질 경우 반복해서 호출하지 않도록. 시간차를 줌.
		clearTimeout(self.ticket);

		self.ticket = setTimeout("getSummaryInfo.getPost()",140);

		$(selectBoxObj.inputObj).unbind('blur',self.blur);
		$(selectBoxObj.inputObj).blur(self.blur);

	}
	/*
	* 포커스가 다른 input 으로 이동했음에도 불구하고 뒤늦게 뜨는 것을 방지하기 위함.
	*/
	,blur : function(){
		var self = getSummaryInfo;

		clearTimeout(self.ticket);
		$(self.selectBoxObj.inputObj).unbind('blur',self.blur);

	}

	,getPost : function(){
		var self = getSummaryInfo;

		var columnInfo = ["번호","적요내용"];


		if((self.param.acntCode) === ''){

			$.post('/sList/summary_search',self.param,function(getListData){


				var listData = [];
				listData.push({no:"0",name:self.searchValue});

				var lists = $(getListData);


				lists.each(function(){
					if(this.name == self.searchValue ){
						return;
					}
					listData.push(this);
				});

				var param = {
					columnName : columnInfo
					,data : listData
					,tdWidth : [0,200]
					,description : "적요 내용을 입력 해 주세요."
				};

				self.selectBoxObj.insertList(param,0,self.selectBoxMethod);
				self.selectBoxObj.choiceTr(-1);

			},'json');

		} else{

			$.post('/sList/summaryLegendSearch',self.param,function(getListData){


				var listData = [];
				listData.push({no:"0",name:self.searchValue});

				var lists = $(getListData);


				lists.each(function(){
					if(this.name == self.searchValue ){
						return;
					}
					listData.push(this);
				});

				var param = {
					columnName : columnInfo
					,data : listData
					,tdWidth : [0,200]
					,description : "적요 내용을 입력 해 주세요."
				};

				self.selectBoxObj.insertList(param,0,self.selectBoxMethod);
				self.selectBoxObj.choiceTr(-1);


			},'json');

		}

	}


	/*
	*	ajax로 불러오기 전에 표시 해주어야 할 것들.
	*/
	,preLoading : function(searchValue){
		var self = getSummaryInfo;

		var columnInfo = ["번호","적요내용"];

		searchValue = searchValue==null ? "" : searchValue;

		var listData = [];
		if(self.searchValue != ""){	listData.push({no:"0", name:self.searchValue });	}
		listData.push({no:"-1",message : "조회 중...<img src='/images/loading.gif' style='vertical-align:middle;width:16px;'/>"});

		var param = {
			columnName : columnInfo
			,data : listData
			,tdWidth : [0,200]
			,description : "적요 내용을 입력 해 주세요."
		};

		self.selectBoxObj.insertList(param,0);

	}
};

//적요 정보를 가지고 옴 (일반전표)
var getSummaryInfoBill ={
	ticket : null
	,param : null
	,getSummaryList : function (selectBoxObj){
		var self = getSummaryInfoBill;
		self.selectBoxObj = selectBoxObj;
		self.selectBoxMethod = self.selectBoxObj.selectBoxMethod;		// 현재의 메쏘드 정보를 저장한다.	당연히 getSummaryInfo.getSummaryList 겠지.

		var searchValue = $.trim(selectBoxObj.inputObj.value);
		self.searchValue = searchValue;

		var acntCode = $('#acntCodeTemp').val();
		var billDate = $('#date').val();
		selectSummary = 1;

		self.preLoading(searchValue);	 // 미리 검색창을 띄워 놓아서 사용자를 기다리지 않게 한다.

		self.param = {
			summary : searchValue
			,acntCode : acntCode
			,billDate : billDate
			,type : 'bill'
		};

		// 0.05 초 이내로 타이핑이 이루어 질 경우 반복해서 호출하지 않도록. 시간차를 줌.
		clearTimeout(self.ticket);

		self.ticket = setTimeout("getSummaryInfoBill.getPost()",140);

		$(selectBoxObj.inputObj).unbind('blur',self.blur);
		$(selectBoxObj.inputObj).blur(self.blur);

	}
	/*
	* 포커스가 다른 input 으로 이동했음에도 불구하고 뒤늦게 뜨는 것을 방지하기 위함.
	*/
	,blur : function(){
		var self = getSummaryInfoBill;

		clearTimeout(self.ticket);
		$(self.selectBoxObj.inputObj).unbind('blur',self.blur);

	}
	,getPost : function(){
		var self = getSummaryInfoBill;

		var columnInfo = ["번호","적요내용"];

		if((self.param.acntCode) === ''){
			$.post('/sList/summary_search',self.param,function(getListData){


				var listData = [];
				listData.push({no:"0",name:self.searchValue});

				var lists = $(getListData);


				lists.each(function(){
					if(this.name == self.searchValue ){
						return;
					}
					listData.push(this);
				});

				var param = {
					columnName : columnInfo
					,data : listData
					,tdWidth : [0,200]
					,description : "적요 내용을 입력 해 주세요."
				};

				self.selectBoxObj.insertList(param,0,self.selectBoxMethod);

			},'json');
		} else{
			$.post('/sList/summaryLegendSearch',self.param,function(getListData){


				var listData = [];
				listData.push({no:"0",name:self.searchValue});

				var lists = $(getListData);


				lists.each(function(){
					if(this.name == self.searchValue ){
						return;
					}
					listData.push(this);
				});

				var param = {
					columnName : columnInfo
					,data : listData
					,tdWidth : [0,200]
					,description : "적요 내용을 입력 해 주세요."
				};

				self.selectBoxObj.insertList(param,0,self.selectBoxMethod);

			},'json');
		}
	}
	/*
	*	ajax로 불러오기 전에 표시 해주어야 할 것들.
	*/
	,preLoading : function(searchValue){
		var self = getSummaryInfoBill;

		var columnInfo = ["번호","적요내용"];

		searchValue = searchValue==null ? "" : searchValue;

		var listData = [];
		if(self.searchValue != ""){	listData.push({no:"0", name:self.searchValue });	}
		listData.push({no:"-1",message : "조회 중...<img src='/images/loading.gif' style='vertical-align:middle;width:16px;'/>"});

		var param = {
			columnName : columnInfo
			,data : listData
			,tdWidth : [0,200]
			,description : "적요 내용을 입력 해 주세요."
		};

		self.selectBoxObj.insertList(param,0);

	}
};


//적요 정보를 가지고 옴 (지출결의서의 지출내역)
var getSummaryInfoTempBill ={
	ticket : null
	,param : null
	,getSummaryList : function (selectBoxObj){
		var self = getSummaryInfoBill;
		self.selectBoxObj = selectBoxObj;
		self.selectBoxMethod = self.selectBoxObj.selectBoxMethod;		// 현재의 메쏘드 정보를 저장한다.	당연히 getSummaryInfo.getSummaryList 겠지.

		var searchValue = $.trim(selectBoxObj.inputObj.value);
		self.searchValue = searchValue;

		var acntCode = $('#acntCodeTemp').val();
		var billDate = $('#date').val();
		selectSummary = 1;

		self.preLoading(searchValue);	 // 미리 검색창을 띄워 놓아서 사용자를 기다리지 않게 한다.

		self.param = {
			summary : searchValue
			,acntCode : acntCode
			,billDate : billDate
			,type : 'bill'
		};

		// 0.05 초 이내로 타이핑이 이루어 질 경우 반복해서 호출하지 않도록. 시간차를 줌.
		clearTimeout(self.ticket);

		self.ticket = setTimeout("getSummaryInfoTempBill.getPost()",140);

		$(selectBoxObj.inputObj).unbind('blur',self.blur);
		$(selectBoxObj.inputObj).blur(self.blur);

	}
	/*
	* 포커스가 다른 input 으로 이동했음에도 불구하고 뒤늦게 뜨는 것을 방지하기 위함.
	*/
	,blur : function(){
		var self = getSummaryInfoBill;

		clearTimeout(self.ticket);
		$(self.selectBoxObj.inputObj).unbind('blur',self.blur);

	}
	,getPost : function(){
		var self = getSummaryInfoBill;

		var columnInfo = ["번호","적요내용"];

		if((self.param.acntCode) === ''){
			$.post('/sList/summary_search',self.param,function(getListData){


				var listData = [];
				listData.push({no:"0",name:self.searchValue});

				var lists = $(getListData);


				lists.each(function(){
					if(this.name == self.searchValue ){
						return;
					}
					listData.push(this);
				});

				var param = {
					columnName : columnInfo
					,data : listData
					,tdWidth : [0,450]
					,description : "적요 내용을 입력 해 주세요."
				};

				self.selectBoxObj.insertList(param,0,self.selectBoxMethod);

			},'json');
		} else{
			$.post('/sList/summaryLegendSearch',self.param,function(getListData){


				var listData = [];
				listData.push({no:"0",name:self.searchValue});

				var lists = $(getListData);


				lists.each(function(){
					if(this.name == self.searchValue ){
						return;
					}
					listData.push(this);
				});

				var param = {
					columnName : columnInfo
					,data : listData
					,tdWidth : [0,450]
					,description : "적요 내용을 입력 해 주세요."
				};

				self.selectBoxObj.insertList(param,0,self.selectBoxMethod);

			},'json');
		}
	}
	/*
	*	ajax로 불러오기 전에 표시 해주어야 할 것들.
	*/
	,preLoading : function(searchValue){
		var self = getSummaryInfoBill;

		var columnInfo = ["번호","적요내용"];

		searchValue = searchValue==null ? "" : searchValue;

		var listData = [];
		if(self.searchValue != ""){	listData.push({no:"0", name:self.searchValue });	}
		listData.push({no:"-1",message : "조회 중...<img src='/images/loading.gif' style='vertical-align:middle;width:16px;'/>"});

		var param = {
			columnName : columnInfo
			,data : listData
			,tdWidth : [0,450]
			,description : "적요 내용을 입력 해 주세요."
		};

		self.selectBoxObj.insertList(param,0);

	}
}


/*
* 은행정보를 가지고 옴
*/
var getBankInfo ={

	ticket : null
	,param : null
	,getSummaryList : function (selectBoxObj){
		var self = getSummaryInfo;
		self.selectBoxObj = selectBoxObj;
		self.selectBoxMethod = self.selectBoxObj.selectBoxMethod;		// 현재의 메쏘드 정보를 저장한다.	당연히 getSummaryInfo.getSummaryList 겠지.

		var searchValue = $.trim(selectBoxObj.inputObj.value);
		self.searchValue = searchValue;

		var acntCode = $('#acntCodeTemp').val();
		var billDate = $('#date').val();
		selectSummary = 1;

		self.preLoading(searchValue);	 // 미리 검색창을 띄워 놓아서 사용자를 기다리지 않게 한다.

		self.param = {
			summary : searchValue
			,acntCode : acntCode
			,billDate : billDate
			,type : 'donation'
		};

		// 0.05 초 이내로 타이핑이 이루어 질 경우 반복해서 호출하지 않도록. 시간차를 줌.
		clearTimeout(self.ticket);

		self.ticket = setTimeout("getSummaryInfo.getPost()",140);

		$(selectBoxObj.inputObj).unbind('blur',self.blur);
		$(selectBoxObj.inputObj).blur(self.blur);

	}
	/*
	* 포커스가 다른 input 으로 이동했음에도 불구하고 뒤늦게 뜨는 것을 방지하기 위함.
	*/
	,blur : function(){
		var self = getSummaryInfo;

		clearTimeout(self.ticket);
		$(self.selectBoxObj.inputObj).unbind('blur',self.blur);

	}

	,getPost : function(){
		var self = getSummaryInfo;

		var columnInfo = ["번호","적요내용"];


		if((self.param.acntCode) === ''){

			$.post('/sList/summary_search',self.param,function(getListData){


				var listData = [];
				listData.push({no:"0",name:self.searchValue});

				var lists = $(getListData);


				lists.each(function(){
					if(this.name == self.searchValue ){
						return;
					}
					listData.push(this);
				});

				var param = {
					columnName : columnInfo
					,data : listData
					,tdWidth : [0,200]
					,description : "적요 내용을 입력 해 주세요."
				};

				self.selectBoxObj.insertList(param,0,self.selectBoxMethod);

			},'json');

		} else{

			$.post('/sList/summaryLegendSearch',self.param,function(getListData){


				var listData = [];
				listData.push({no:"0",name:self.searchValue});

				var lists = $(getListData);


				lists.each(function(){
					if(this.name == self.searchValue ){
						return;
					}
					listData.push(this);
				});

				var param = {
					columnName : columnInfo
					,data : listData
					,tdWidth : [0,200]
					,description : "적요 내용을 입력 해 주세요."
				};

				self.selectBoxObj.insertList(param,0,self.selectBoxMethod);


			},'json');

		}

	}


	/*
	*	ajax로 불러오기 전에 표시 해주어야 할 것들.
	*/
	,preLoading : function(searchValue){
		var self = getSummaryInfo;

		var columnInfo = ["번호","적요내용"];

		searchValue = searchValue==null ? "" : searchValue;

		var listData = [];
		if(self.searchValue != ""){	listData.push({no:"0", name:self.searchValue });	}
		listData.push({no:"-1",message : "조회 중...<img src='/images/loading.gif' style='vertical-align:middle;width:16px;'/>"});

		var param = {
			columnName : columnInfo
			,data : listData
			,tdWidth : [0,200]
			,description : "적요 내용을 입력 해 주세요."
		};

		self.selectBoxObj.insertList(param,0);

	}
}


/*
* 예금주를 가져옴.(헌금전표)
*/
var getHoderInfo ={

	ticket : null
	,param : null
	,getSummaryList : function (selectBoxObj){
		var self = getSummaryInfo;
		self.selectBoxObj = selectBoxObj;
		self.selectBoxMethod = self.selectBoxObj.selectBoxMethod;		// 현재의 메쏘드 정보를 저장한다.	당연히 getSummaryInfo.getSummaryList 겠지.

		var searchValue = $.trim(selectBoxObj.inputObj.value);
		self.searchValue = searchValue;

		var acntCode = $('#acntCodeTemp').val();
		var billDate = $('#date').val();
		selectSummary = 1;

		self.preLoading(searchValue);	 // 미리 검색창을 띄워 놓아서 사용자를 기다리지 않게 한다.

		self.param = {
			summary : searchValue
			,acntCode : acntCode
			,billDate : billDate
			,type : 'donation'
		};

		// 0.05 초 이내로 타이핑이 이루어 질 경우 반복해서 호출하지 않도록. 시간차를 줌.
		clearTimeout(self.ticket);

		self.ticket = setTimeout("getSummaryInfo.getPost()",140);

		$(selectBoxObj.inputObj).unbind('blur',self.blur);
		$(selectBoxObj.inputObj).blur(self.blur);

	}
	/*
	* 포커스가 다른 input 으로 이동했음에도 불구하고 뒤늦게 뜨는 것을 방지하기 위함.
	*/
	,blur : function(){
		var self = getSummaryInfo;

		clearTimeout(self.ticket);
		$(self.selectBoxObj.inputObj).unbind('blur',self.blur);

	}

	,getPost : function(){
		var self = getSummaryInfo;

		var columnInfo = ["번호","적요내용"];


		if((self.param.acntCode) === ''){

			$.post('/sList/summary_search',self.param,function(getListData){


				var listData = [];
				listData.push({no:"0",name:self.searchValue});

				var lists = $(getListData);


				lists.each(function(){
					if(this.name == self.searchValue ){
						return;
					}
					listData.push(this);
				});

				var param = {
					columnName : columnInfo
					,data : listData
					,tdWidth : [0,200]
					,description : "적요 내용을 입력 해 주세요."
				};

				self.selectBoxObj.insertList(param,0,self.selectBoxMethod);

			},'json');

		} else{

			$.post('/sList/summaryLegendSearch',self.param,function(getListData){


				var listData = [];
				listData.push({no:"0",name:self.searchValue});

				var lists = $(getListData);


				lists.each(function(){
					if(this.name == self.searchValue ){
						return;
					}
					listData.push(this);
				});

				var param = {
					columnName : columnInfo
					,data : listData
					,tdWidth : [0,200]
					,description : "적요 내용을 입력 해 주세요."
				};

				self.selectBoxObj.insertList(param,0,self.selectBoxMethod);


			},'json');

		}

	}


	/*
	*	ajax로 불러오기 전에 표시 해주어야 할 것들.
	*/
	,preLoading : function(searchValue){
		var self = getSummaryInfo;

		var columnInfo = ["번호","적요내용"];

		searchValue = searchValue==null ? "" : searchValue;

		var listData = [];
		if(self.searchValue != ""){	listData.push({no:"0", name:self.searchValue });	}
		listData.push({no:"-1",message : "조회 중...<img src='/images/loading.gif' style='vertical-align:middle;width:16px;'/>"});

		var param = {
			columnName : columnInfo
			,data : listData
			,tdWidth : [0,200]
			,description : "적요 내용을 입력 해 주세요."
		};

		self.selectBoxObj.insertList(param,0);

	}
}

/*
* 계좌번호를 가져옴.(헌금전표)
*/
var getAccount_noInfo ={

	ticket : null
	,param : null
	,getSummaryList : function (selectBoxObj){
		var self = getSummaryInfo;
		self.selectBoxObj = selectBoxObj;
		self.selectBoxMethod = self.selectBoxObj.selectBoxMethod;		// 현재의 메쏘드 정보를 저장한다.	당연히 getSummaryInfo.getSummaryList 겠지.

		var searchValue = $.trim(selectBoxObj.inputObj.value);
		self.searchValue = searchValue;

		var acntCode = $('#acntCodeTemp').val();
		var billDate = $('#date').val();
		selectSummary = 1;

		self.preLoading(searchValue);	 // 미리 검색창을 띄워 놓아서 사용자를 기다리지 않게 한다.

		self.param = {
			summary : searchValue
			,acntCode : acntCode
			,billDate : billDate
			,type : 'donation'
		};

		// 0.05 초 이내로 타이핑이 이루어 질 경우 반복해서 호출하지 않도록. 시간차를 줌.
		clearTimeout(self.ticket);

		self.ticket = setTimeout("getSummaryInfo.getPost()",140);

		$(selectBoxObj.inputObj).unbind('blur',self.blur);
		$(selectBoxObj.inputObj).blur(self.blur);

	}
	/*
	* 포커스가 다른 input 으로 이동했음에도 불구하고 뒤늦게 뜨는 것을 방지하기 위함.
	*/
	,blur : function(){
		var self = getSummaryInfo;

		clearTimeout(self.ticket);
		$(self.selectBoxObj.inputObj).unbind('blur',self.blur);

	}

	,getPost : function(){
		var self = getSummaryInfo;

		var columnInfo = ["번호","적요내용"];


		if((self.param.acntCode) === ''){

			$.post('/sList/summary_search',self.param,function(getListData){


				var listData = [];
				listData.push({no:"0",name:self.searchValue});

				var lists = $(getListData);


				lists.each(function(){
					if(this.name == self.searchValue ){
						return;
					}
					listData.push(this);
				});

				var param = {
					columnName : columnInfo
					,data : listData
					,tdWidth : [0,200]
					,description : "적요 내용을 입력 해 주세요."
				};

				self.selectBoxObj.insertList(param,0,self.selectBoxMethod);

			},'json');

		} else{

			$.post('/sList/summaryLegendSearch',self.param,function(getListData){


				var listData = [];
				listData.push({no:"0",name:self.searchValue});

				var lists = $(getListData);


				lists.each(function(){
					if(this.name == self.searchValue ){
						return;
					}
					listData.push(this);
				});

				var param = {
					columnName : columnInfo
					,data : listData
					,tdWidth : [0,200]
					,description : "적요 내용을 입력 해 주세요."
				};

				self.selectBoxObj.insertList(param,0,self.selectBoxMethod);


			},'json');

		}

	}


	/*
	*	ajax로 불러오기 전에 표시 해주어야 할 것들.
	*/
	,preLoading : function(searchValue){
		var self = getSummaryInfo;

		var columnInfo = ["번호","적요내용"];

		searchValue = searchValue==null ? "" : searchValue;

		var listData = [];
		if(self.searchValue != ""){	listData.push({no:"0", name:self.searchValue });	}
		listData.push({no:"-1",message : "조회 중...<img src='/images/loading.gif' style='vertical-align:middle;width:16px;'/>"});

		var param = {
			columnName : columnInfo
			,data : listData
			,tdWidth : [0,200]
			,description : "적요 내용을 입력 해 주세요."
		};

		self.selectBoxObj.insertList(param,0);

	}
}


/*
* /////////////////////////////////////////////////협동비에서 사용함, 지방회명 교회명을 가지고 온다. @2014.08.06
*/

var getCooperativeInfo ={
	ticket : null
	,param : null
	,columnInfo : {
		1 : ["지방회명","교회명","이름","연락처","기관ID"]
	}
	/*
	*	각 컬럼의 width 값 지정. 값이 0이면 width =0 으로 하지 않고 아예 td를 생성 하지 않아 버림.
	*/
	,columnWidth : {

		1 : [130,100,70,120,0]
	}

	,description : {
		1 : ""

	}

	,getUserList : function (selectBoxObj){

		var self = getCooperativeInfo;							// 자기 자신을 this 로 참조 하지 못해서 억지로 self 로 참조하도록 함.
		self.selectBoxObj = selectBoxObj;					// selectBox 객체
		self.selectBoxMethod = self.selectBoxObj.selectBoxMethod;	// 현재의 메쏘드 정보를 저장한다.	당연히 getUserInfo.getUserList 겠지.

		var searchValue = selectBoxObj.inputObj.value;	// 원래 이 메쏘드에 2번째 argument로 searchValue 를 넘겨주지만 이름검색은 그것을 사용하면 포커스가 갔을 때 null 값이 넘어오므로 목록이 생기지 않는다.
		self.searchValue = searchValue==null ? "" : searchValue;

		self.name = searchValue;

		if(searchValue.indexOf("@") != -1){				// 구역에 대한 정보 파싱

			var tmp = searchValue.split("@");
			self.name = tmp[0];
			self.groupName = tmp[1];

		}else if(searchValue.indexOf("#") != -1){		// 생일에 대한 정보 파싱

			var tmp = searchValue.split("#");
			self.name = tmp[0];
			if(String(tmp[1]).length >= 2 && String(tmp[1]).length <= 6){	// 2글짜에서 6글짜 사이여야 검색 시작.
				self.birthDate = tmp[1];
				var tmpYear = self.birthDate.substr(0,2);
				birthYear = tmpYear > 13 ? '19'+tmpYear : '20'+tmpYear;
				var tmpDay = self.birthDate.substr(2,4);
				birthDay = tmpDay.length == 4 ? tmpDay : null;

				var nowDate = new Date();
				var nowYear =nowDate.getYear();
				self.age = nowYear - birthYear + 1;
			}

		}

		self.param = {
			area_name : self.name
		};

		self.preLoading();	 // 미리 검색창을 띄워 놓아서 사용자를 기다리지 않게 한다.

		if(name == "" || searchValue=="" || searchValue == null){ return; }	// 입력 값이 없으면 이대로 종료.

		// 0.02 초 이내로 타이핑이 이루어 질 경우 반복해서 호출하지 않도록. 시간차를 줌.
		clearTimeout(self.ticket);

		//$(self.selectBoxObj.inputObj).attr('loadingStatus','true');

		self.ticket = setTimeout("getCooperativeInfo.getPost()",140);

		$(selectBoxObj.inputObj).unbind('blur',self.blur);	// blur 효과가 중복으로 발생되서 그거 방지하기 위해 unbind 를 건다.
		$(selectBoxObj.inputObj).blur(self.blur);

	}
	/*
	*	포커스가 다른 input 으로 이동했음에도 불구하고 뒤늦게 뜨는 것을 방지하기 위함.
	*/
	,blur : function(){

		var self = getCooperativeInfo;
		clearTimeout(self.ticket);
		$(self.selectBoxObj.inputObj).unbind('blur',self.blur);

	}
	,getPost : function(){
		var self = getCooperativeInfo;


		$.post('/sList/cooperative_search',self.param,function(getListData){

			var listData = [];
			var autoIndex = 0;	// 자동 선택 되는 row 의 index 를 지정.


			var lists = $(getListData);

			if(lists.length == 0){
				autoIndex = 0;
				listData.push({message : "검색 결과가 없습니다."});
			}

			lists.each(function(){
				listData.push(this);
				autoIndex = 1;

			});

			var param = {
				columnName : self.columnInfo[1]
				,data : listData
				,tdWidth : self.columnWidth[1]
				,description : self.description[1]
			};

			if( self.selectBoxObj.insertList(param,autoIndex,self.selectBoxMethod) == true ){
				self.selectBoxObj.autoChoiceBeforeSelect();	// 그 이전에 선택했던 것 다시 선택.
			}

		},'json');
	}


	/*
	*	ajax로 불러오기 전에 표시 해주어야 할 것들.
	*/
	,preLoading : function(){
		var self = getCooperativeInfo;
		var autoIndex = null;

		var listData = [];

		if(self.name == ""){
			//listData.push({message : "봉투번호 또는 이름을 입력 해 주세요. (아래의 설명을 참조 해주세요)"});
		}else{

			listData.push({message : "조회 중...<img src='/images/loading.gif' style='width:16px;vertical-align:middle;'/>"});
		}

		var param = {
			columnName : self.columnInfo[1]
			,data : listData
			,tdWidth : self.columnWidth[1]
			,description : self.description[1]
		};


		self.selectBoxObj.insertList(param);

	}
}
///////////////////////////////////////////////////end

// Start-----------------------------------------------------------
// 재정성도의 이름 / 휴대폰 / 생년월일만을 가지고 옴.

// End-----------------------------------------------------------


//계정과목 정보를 가져옴
var getAccountInfo ={
	ticket : null
	,param : null
	,getAccountList : function (selectBoxObj){
		var self = getSummaryInfoBill;
		self.selectBoxObj = selectBoxObj;
		self.selectBoxMethod = self.selectBoxObj.selectBoxMethod;		// 현재의 메쏘드 정보를 저장한다.	당연히 getSummaryInfo.getSummaryList 겠지.

		var searchValue = $.trim(selectBoxObj.inputObj.value);
		self.searchValue = searchValue;

		self.preLoading(searchValue);	 // 미리 검색창을 띄워 놓아서 사용자를 기다리지 않게 한다.

		self.param = {
			acntName : searchValue
		};

		// 0.05 초 이내로 타이핑이 이루어 질 경우 반복해서 호출하지 않도록. 시간차를 줌.
		clearTimeout(self.ticket);

		self.ticket = setTimeout("getAccountInfo.getPost()",50);

		$(selectBoxObj.inputObj).unbind('blur',self.blur);
		$(selectBoxObj.inputObj).blur(self.blur);

	}
	/*
	 * 포커스가 다른 input 으로 이동했음에도 불구하고 뒤늦게 뜨는 것을 방지하기 위함.
	 */
	,blur : function(){
		var self = getSummaryInfoBill;

		clearTimeout(self.ticket);
		$(self.selectBoxObj.inputObj).unbind('blur',self.blur);

	}
	,getPost : function(){
		var self = getSummaryInfoBill;

		var columnInfo = ["no", "코드", "계정명", "상위계정"];

		$.post('/sList/accountSearch',self.param,function(getListData){

			var listData = [];
			var lists = $(getListData);

			lists.each(function(){
				listData.push(this);
			});

			var param = {
				columnName : columnInfo
				,data : listData
				,tdWidth : [50,0, 100, 200]
				,description : "번호 또는 계정명을<br>입력 해주세요"
			};

			self.selectBoxObj.insertList(param,0,self.selectBoxMethod);

		},'json');
	}
	/*
	 *	ajax로 불러오기 전에 표시 해주어야 할 것들.
	 */
	,preLoading : function(searchValue){
		var self = getSummaryInfoBill;

		var columnInfo = ["no", "코드","계정명", "상위계정"];

		searchValue = searchValue==null ? "" : searchValue;

		var listData = [];
		if(self.searchValue != ""){	listData.push({no:"0", name:self.searchValue });	}
		listData.push({no:"-1",message : "조회 중...<img src='/images/loading.gif' style='vertical-align:middle;width:16px;'/>"});

		var param = {
			columnName : columnInfo
			,data : listData
			,tdWidth : [50,0, 100, 200]
			,description : "번호 또는 계정명을<br>입력 해주세요"
		};

		self.selectBoxObj.insertList(param,0);

	}
};


/*
*	숫자로 되어있는지 확인 하는 부분.
*/
function chkNum(value) {
	for(var i = 0; i < value.length; i++) {
		c = value.charAt(i);
		if(!(c >= '0' && c <= '9')) {
			return false;
		}
	}
	return true;
}


function ctrlKeyAction(keyCode){	// 헌금자 타입을 바꿔줌.
	var num = keyCode-48;
	$('#memTypeRadio'+num).prop('checked',true);
}

function handleAltKeyCombo (event) {
	var keyCode = event.keyCode;
	if(event.altKey == true && (( keyCode >=96 && keyCode <=105) || (keyCode >= 48 && keyCode <=57)) ){
		if(keyCode >= 96){	keyCode -= 48; }
		ctrlKeyAction(keyCode);
	}
}
document.addEventListener("keydown", function(event){
	handleAltKeyCombo(event);
});
$(document).ready(function () {
	$("input[type='text']").on('keydown', function(event) {
		if(event.altKey == true) {
			handleAltKeyCombo(event);
		}
	})
})
//가상계좌 추가 정보에서.. 이름 인풋 박스 클릭시 작동..
var getUserInfoVpa ={
	ticket : null
	,param : null
	,columnInfo : {
		1 : ["번호","봉투<br>번호","이름","직분","생년월일","배우자","세대","교구","구역","핸드폰","자녀이름","","","","","","주소1","주소2","성별","","",""]
	}
	/*
	 *	각 컬럼의 width 값 지정. 값이 0이면 width =0 으로 하지 않고 아예 td를 생성 하지 않아 버림.
	 */
	,columnWidth : {
		1 : [40,0,90,0,100,0,0,0,0,100,0,0,0,0,0,0,0,0,0,0,0,0]

	}
	,description : {
		1 : "이름을 입력 해주세요."

	}
	,getUserList : function (selectBoxObj){
		var self = getUserInfoVpa;							// 자기 자신을 this 로 참조 하지 못해서 억지로 self 로 참조하도록 함.
		self.selectBoxObj = selectBoxObj;					// selectBox 객체
		self.selectBoxMethod = self.selectBoxObj.selectBoxMethod;	// 현재의 메쏘드 정보를 저장한다.	당연히 getUserInfo.getUserList 겠지.

		var searchValue = selectBoxObj.inputObj.value;	// 원래 이 메쏘드에 2번째 argument로 searchValue 를 넘겨주지만 이름검색은 그것을 사용하면 포커스가 갔을 때 null 값이 넘어오므로 목록이 생기지 않는다.
		self.searchValue = searchValue==null ? "" : searchValue;

		var memType = 1;

		self.name = searchValue;
		self.groupName = "";
		self.birthDate = "";
		self.age = "";

		var birthYear = "";
		var birthDay = "";
		var age = "";


		self.param = {
			name : self.name
			,groupName : self.groupName
			,birthYear: birthYear
			,birthDay: birthDay
			,memType : memType
		};


		self.preLoading();	 // 미리 검색창을 띄워 놓아서 사용자를 기다리지 않게 한다.

		if(name == "" || searchValue=="" || searchValue == null){ return; }	// 입력 값이 없으면 이대로 종료.

		if(/[ㄱ-ㅎ]/.exec(self.name)){
			// 초성만 입력된 부분이 있다면 이름검색을 하지 않도록.
			self.preLoading(self.name);
			return;
		}
		// 0.02 초 이내로 타이핑이 이루어 질 경우 반복해서 호출하지 않도록. 시간차를 줌.
		clearTimeout(self.ticket);

		//$(self.selectBoxObj.inputObj).attr('loadingStatus','true');

		self.ticket = setTimeout("getUserInfoVpa.getPost()",140);

		$(selectBoxObj.inputObj).unbind('blur',self.blur);	// blur 효과가 중복으로 발생되서 그거 방지하기 위해 unbind 를 건다.
		$(selectBoxObj.inputObj).blur(self.blur);

	}
	/*
	 *	포커스가 다른 input 으로 이동했음에도 불구하고 뒤늦게 뜨는 것을 방지하기 위함.
	 */
	,blur : function(){

		var self = getUserInfoVpa;
		clearTimeout(self.ticket);
		$(self.selectBoxObj.inputObj).unbind('blur',self.blur);

	}
	,getPost : function(){
		var self = getUserInfoVpa;

		$.post('/sList/memberLegendSearch',self.param,function(getListData){
			//$(self.selectBoxObj.inputObj).removeAttr('loadingStatus');

			var listData = [];
			var autoIndex = 0;	// 자동 선택 되는 row 의 index 를 지정.


			var lists = $(getListData);

			if(lists.length == 0){
				autoIndex = 0;
				listData.push({message : "검색 결과가 없습니다."});
			}
			lists.each(function(){
				listData.push(this);
			});


			var param = {
				columnName : self.columnInfo[self.param.memType]
				,data : listData
				,tdWidth : self.columnWidth[self.param.memType]
				,description : self.description[self.param.memType]
			};

			// 기본 파라미터, 자동선택 index, 현재 객체(포커스 이동 후 창 띄우지 않기 위해)

			if( self.selectBoxObj.insertList(param,autoIndex,self.selectBoxMethod) == true ){
				self.selectBoxObj.autoChoiceBeforeSelect();	// 그 이전에 선택했던 것 다시 선택.
			}

		},'json');
	}
	/*
	 *	ajax로 불러오기 전에 표시 해주어야 할 것들.
	 */
	,preLoading : function(){
		var self = getUserInfoVpa;
		var autoIndex = null;

		var listData = [];

		if(self.name == ""){
			//listData.push({message : "봉투번호 또는 이름을 입력 해 주세요. (아래의 설명을 참조 해주세요)"});
		}else{

			listData.push({message : "조회 중...<img src='/images/loading.gif' style='width:16px;vertical-align:middle;'/>"});
		}

		var param = {
			columnName : self.columnInfo[self.param.memType]
			, data: listData
			, tdWidth: self.columnWidth[self.param.memType]
			, description: self.description[self.param.memType]
		};


		self.selectBoxObj.insertList(param);

	}
}

// ---------------------------------------------- 새로 만들어준 스타일 ------------------------------------------------------

// 아직 selectBox 1.0 을 사용하지 않는 곳을 위해서 오류 안나오도록 처리
if (typeof (OhjicSelect) == 'undefined') {
	var OhjicSelect = function () {
	};
}

var bankAccountModel = new OhjicSelect({
	colModel: function (selectBox, $inputObj) {

		return [
			{title: "번호", dataIndx: "disp_bank_id", width: 60, dataType: "String", cls: 'text-center'},
			{title: "요약", dataIndx: "name", width: 110, dataType: "String", cls: 'text-center'},
			{title: "은행명", dataIndx: "bankName", width: 110, dataType: "String"},
			{title: "은행분류", dataIndx: "bankType", width: 110, dataType: "String"},
			{title: "설명", dataIndx: "description", width: 300, dataType: "String"},
		];
	},
	dataType: 'local', // local or remote
	dataModel: function (req, cb) {

		var $inputTarget = $(this.selectBoxObj.inputObj);
		var $form = $inputTarget.closest('.form-container');
		var billType = $form.find('input[name=billType]').val();
		var acntCode = $form.find('input[name=acntCode]').val();
		var bankID = $form.find('input[name=bankID]').val();
		var acntType = acntCode == '' ? '' : acntCode.substr(0, 1);
		acntCode = acntCode * 1;
		acntType = parseInt(acntType);
		var newArr = [];

		var BankIds = [];

		if (checkTransType(TRANS_DEBIT_CREDIT, billType)) {

			if (acntCode !== 0) {
				// console.log(bankAccountTypes);
				bankAccountTypes.map(function (obj) {
					// 0보다 작은 값을 이미 넣어놓은 것 제거하려다가 마이너스 값은 입력에서 허용을 안해서 99999 번으로 처리
					// 계정과목이 수입이거나 지출 일때는 계정과목 모두 보여짐 (사실 의미가 없는데 교회에서 원해서 넣어주도록 함)
					if (parseInt(obj.acnt_code) === acntCode || acntType === 1 || acntType === 2) {
						newArr.push(obj);
					}
				});
			}

			BankIds = $.extend([], newArr);
			BankIds.unshift({no: 99999, name: '-', bankName: '선택안함', acnt_code: '0'});

		} else if (checkTransType(TRANS_F_INCOME_EXPENSE, billType)) {
			BankIds = $.extend([], bankAccountTypes);
		} else if (checkTransType(TRANS_DEPOSIT_WITHDRAW, billType)) {

			if (acntCode !== 0) {
				bankAccountTypes.map(function (obj) {
					if (obj.acnt_code * 1 === acntCode) {	// 0보다 작은 값을 이미 넣어놓은 것 제거하려다가 마이너스 값은 입력에서 허용을 안해서 99999 번으로 처리
						newArr.push(obj);
					}
				});
				BankIds = $.extend([], newArr);
			} else {
				BankIds = $.extend([], bankAccountTypes);
			}


			BankIds.unshift({no: 99999, name: '-', bankName: '선택안함', acnt_code: '0'});

		}

		var findIndex;
		BankIds.map(function (obj, index) {
			obj.disp_bank_id = obj.no === 99999 ? '' : obj.no;
			if (obj.no == bankID) {
				findIndex = index;
			}
		});

		// console.dir(findIndex);
		// console.dir(bankID);

		cb(BankIds, {autoIndex: findIndex});

	},
	adjust: function (el, data, $inputTarget) {

		if (data !== null) {

			$('#bankID').val(data.no);
			$('#currency_flag').val(data.currency_flag);
			if (data.no == 0) {
				$("#bank, #holder , #account_no").val('').prop("disabled", true).attr('selectno', '').attr('selectname', '');
			} else {
				$("#bank, #holder , #account_no").prop("disabled", false);
			}

			var $form = $inputTarget.closest('.form-container');
			var billType = $form.find('input[name=billType]').val() * 1;
			if ($form.attr('id') === 'tabs-1') {	// 일반전표 입력일 경우에만

				if (checkTransType(TRANS_DEPOSIT_WITHDRAW, billType) && parseInt(data.acnt_code) !== 0) {
					// console.dir(data);
					$form.find('input[name=acntCode]').val(data.acnt_code);
					$form.find('input[name=acntName]').val(data.acnt_name).attr('selectName', data.acnt_name).attr('selectNo', data.acnt_code);
				}
			}

		} else {
			$('#bankID, #bankName, #currency_flag').val("");
		}


	},
});


var transactionModel = new OhjicSelect({
	colModel: function (selectBox, $inputObj) {
		return [
			{title: "번호", dataIndx: "no", width: 30, dataType: "String", cls: 'text-center'},
			{title: "구분", dataIndx: "name", width: 100, dataType: "String"},
			{title: "설명", dataIndx: "description", width: 600, dataType: "String"},
		];
	},
	dataType: 'local', // local or remote
	dataModel: function (req, cb, $inputTarget) {

		var $form = $inputTarget.closest('.form-container');
		var billType = $form.find('input[name=billType]').val() * 1;
		var billNo = $form.find('#billNo').val() * 1;

		var transactionTypes = [
			{no: 1, type: TRANS_BASE_INCOME, name: "수입", description: '수입이 발생했을 때 사용합니다'},
			{no: 2, type: TRANS_BASE_EXPENSE, name: "지출", description: '지출이 발생했을 때 사용합니다'},
			{
				no: 4,
				type: TRANS_WITHDRAW_CREDIT,
				name: "계좌이체/출금",
				description: '<b>현금/계좌에 출금시</b> 출금계좌 선택, <b>부채 발생시</b> 대출 계좌 선택, <b>부채 상환시</b> 출금계좌 선택'
			},
			{
				no: 3,
				type: TRANS_DEPOSIT_DEBIT,
				name: "계좌이체/입금",
				description: '<b>현금/계좌에 입금시</b> 입금계좌 선택, <b>부채 발생시</b> 입금받을 계좌 선택, <b>부채 상환시</b> 대출계좌 선택'
			},
			{no: 5, type: TRANS_BASE_DEBIT, name: "차변", description: '복식부기 차변 전표입력시 사용합니다.'},
			{no: 6, type: TRANS_BASE_CREDIT, name: "대변", description: '복식부기 대변 전표입력시 사용합니다.'},
		];
		var findIndex = 0;
		var newType = [];

		if (billNo > 0 && billType > 0) {	// 수정모드 일경우에는 같은 종류의 billType 만 선택 가능하다
			var filterBillType;
			if (checkTransType(TRANS_DEBIT_CREDIT, billType)) {
				filterBillType = TRANS_DEBIT_CREDIT;
			} else if (checkTransType(TRANS_DEPOSIT_WITHDRAW, billType)) {
				filterBillType = TRANS_DEPOSIT_WITHDRAW;
			} else if (checkTransType(TRANS_F_INCOME_EXPENSE, billType)) {
				filterBillType = TRANS_F_INCOME_EXPENSE;
			}

			transactionTypes.map(function (obj) {

				if (filterBillType.indexOf(obj.type * 1) > -1) {
					newType.push(obj);
				}
			});

		} else {
			newType = transactionTypes;
		}

		cb(newType, {autoIndex: findIndex});

	},
	adjust: function (el, data, $inputTarget) {

		if (data != null) {

			var $form = $inputTarget.closest('.form-container');
			$inputTarget.removeAttr("passThisObj"); // focusMove 에서 간혹 포커스 이동을 제재 해야할 경우 활용.
			$form.find('input[name=billType]').val(data.type);

			inputOn();

			var bankIdEl = $form.find('input[name=bankID]');
			var bankIdNameEl = $form.find('input[name=bank_name]');
			var acntNameEl = $form.find('input[name=acntName]');
			var acntCodeEl = $form.find('input[name=acntCode]');
			if (TRANS_INCOME_EXPENSE.indexOf(data.type) === -1) {
				bankIdEl.val('');
				bankIdNameEl.val('');
			}
			acntNameEl.val('');
			acntCodeEl.val('');

			if ($form.attr('id') === 'tabs-1') {	// 일반전표 입력일 경우에만

				if (checkTransType(TRANS_F_INCOME_EXPENSE, data.type)) {

					// bankIdEl.val(DEFAULT_BANK_ID_CASH);
					// bankIdNameEl.val(DEFAULT_BANK_NAME_CASH);


				} else if (checkTransType(TRANS_DEPOSIT_WITHDRAW, data.type)) {
					// $form.find('.billBoardDetail .column-acnt-code').hide();
					// $form.find('.billBoardDetail .column-acnt-code input[type=checkbox]').prop('checked', false);
					// $form.find('.billBoardDetail .column-bank').css('width', 198);
					// $form.find('.billBoardDetail .column-bank input[type=text]').css('width', 190);
				} else {
					// $form.find('.billBoardDetail .column-acnt-code').show();
					// $form.find('.billBoardDetail .column-acnt-code input[type=checkbox]').prop('checked', true);
					// $form.find('.billBoardDetail .column-bank').css('width', 80);
					// $form.find('.billBoardDetail .column-bank input[type=text]').css('width', 65);
				}

			} else {

			}

			// if (churchCode == 4726) {
			// 	setAccountChange.setBillType(data.type);
			// }


			var money = $.trim($('#amount').val()) != "" ? $.trim($('#amount').val()) : $.trim($('#amount2').val());
			dcAct.dcBillTypeCheck(data.type, String(money).split(",").join(""));

		} else {
			$('#billText').val("");
			$('#billType').val("");
			$('#bankName').val("");
			$('#bankID').val("");
			$('#billText').attr("passThisObj", "block");
			//	$('#billText').blur().focus();				// 선택 목록 재 활성화를 위해서.
			inputOff();
		}

		acntInfomation();
	},
});

var accountModel = new OhjicSelect({
	colModel: function (selectBox, $inputObj) {
		return [
			{title: "번호", dataIndx: "no", width: 80, dataType: "String"},
			{title: "계정명", dataIndx: "name", width: 200, dataType: "String"},
			{title: "상위계정", dataIndx: "parentAccount", width: 300, dataType: "String"},
			{title: "계정설명", dataIndx: "descript", width: 150, dataType: "String"},
		];
	},
	dataType: 'local', // local or remote
	dataModel: function (req, cb, $inputTarget) {

		var $form = $inputTarget.closest('.form-container');
		var billType = $form.find('input[name=billType]').val() * 1;
		var listItem = [];
		var searchText = $.trim(req);
		var self = this;

		// console.dir(req);
		// console.dir(searchText);


		accountTypes.map(function (obj) {
			var acntCodeType = obj.code.substr(0, 1) * 1;

			// console.dir(obj.no +'-' + obj.name +'-' + obj.parentAccount +'-'+searchText );

			if (searchText !== '' && self.selectBoxObj.evTrigger !== 'focus') {
				if (!(String(obj.no).indexOf(searchText) > -1 || String(obj.name).indexOf(searchText) > -1 || String(obj.parentAccount).indexOf(searchText) > -1)) {
					return;
				}
			}


			// if (value == null || (typeof (this.no) != 'undefined' && String(this.no).indexOf(value) >= 0) || (typeof (this.name) != 'undefined' && this.name.indexOf(value) !== -1) || (typeof (this.parentAccount) != 'undefined' && this.parentAccount != null && this.parentAccount.indexOf(value) !== -1)) {
			// 	tmpArr.push(this);
			// }

			if (checkTransType(TRANS_F_INCOME_EXPENSE, billType)) {
				listItem.push(obj);
			} else if (checkTransType(TRANS_DEPOSIT_WITHDRAW, billType)) {
				if (acntCodeType >= 3) {
					listItem.push(obj);
				}
			} else {

				listItem.push(obj);
			}
		});

		cb(listItem);

	},
	adjust: function (el, data, $inputTarget) {

		// console.dir($inputTarget);


		var $form = $inputTarget.closest('.form-container');
		var billTypeEl = $form.find('input[name=billType]');
		var billType = billTypeEl.val() * 1;
		var bankIdEl = $form.find('input[name=bankID]');
		var bankNameEl = $form.find('input[name=bank_name]');
		var amountEl = $form.find('input.amount:not(:disabled)');
		var amountVal = amountEl.val();

		// console.dir(amountVal);
		// var acntNameEl = $form.find('input[name=acntName]');
		// var acntCodeEl = $form.find('input[name=acntCode]');


		if (data !== null) {

			$('#acntCodeTemp').val(data.code); //2012-08-17 no를 code로 수정
			$("#depth1").val(data.depth1);
			$("#depth2").val(data.depth2);
			$("#depth3").val(data.depth3);
			$("#account_summary").text(data.parentAccountSummary);

			typeDtmnAcnt = false;
			if (typeof useDtmnAcnt != 'undefined' && useDtmnAcnt == true) {
				if (typeof data.campaign_idx != 'undefined' && data.campaign_idx > 0) {
					typeDtmnAcnt = true;
				}
			}


			if (checkTransType(TRANS_DEPOSIT_WITHDRAW, billType)) {
				var acntType = data.code.substr(0, 1) * 1;
				var dcType;
				if (checkTransType(TRANS_DEPOSIT_ALL, billType)) {
					if (acntType === 3) {
						dcType = TRANS_BASE_DEBIT;
						billTypeEl.val(TRANS_DEPOSIT_DEBIT);
					} else if (acntType === 4 || acntType === 5) {
						dcType = TRANS_BASE_CREDIT;
						billTypeEl.val(TRANS_DEPOSIT_CREDIT);
					}
				} else if (checkTransType(TRANS_WITHDRAW_ALL, billType)) {
					if (acntType === 3) {
						dcType = TRANS_BASE_CREDIT;
						billTypeEl.val(TRANS_WITHDRAW_CREDIT);
					} else if (acntType === 4 || acntType === 5) {
						dcType = TRANS_BASE_DEBIT;
						billTypeEl.val(TRANS_WITHDRAW_DEBIT);
					}
				}

				dcAct.dcBillTypeCheck(dcType, amountVal);

			}

			if (checkTransType(TRANS_ALL_DEBIT_CREDIT, billType)) {

				//계좌이체는 계정마다 계좌가 다르므로 계좌를 초기화 해줘야 한다.
				bankIdEl.val('');
				bankNameEl.val('');
			}


			if (typeof findPartAccount != 'undefined') {
				findPartAccount(data);
			}
			if (typeof acntInfomation == 'function') {
				acntInfomation(data['code']);
			}
		} else {
			$('#acntCodeTemp').val("");
			$('#acntName').val("");
		}
		getAccountSum();

	},
});

var summarySelectModel = new OhjicSelect({
	colModel: [
		{title: "적요내용", dataIndx: "name", width: 350, dataType: "String"},
	],
	delay: 300,
	correct: false,	 // 일치하지 않는 값도 선택할 수 있음
	dropdownMode: false,	// 커서 이동에 따라 input 의 값이 같이 바뀌는 스타일
	usingPreLoading: false,	// 커서 이동에 따라 input 의 값이 같이 바뀌는 스타일
	dataType: 'remote', // local or remote
	dataModel: function (req, cb, $inputTarget) {

		var $form = $inputTarget.closest('form');
		var acntCode = $form.find('input[name=acntCode]').val();
		var billDate = $form.find('input[name=date]').val();
		var param;

		if (req !== '') {
			cb({no: 0, name: req});
		}
		
		if(/[ㄱ-ㅎ]/.exec(req)){
			// 초성만 입력된 부분이 있다면 검색을 하지 않도록.
			return;
		}

		var requestUrl = acntCode === '' ? '/sList/summary_search' : '/sList/summaryLegendSearch';
		param = {
			summary: req,
			acntCode: acntCode,
			billDate: billDate,
			type: 'bill',
		};

		this.getDataByRemote(requestUrl, param, function (getListData) {

			var listData = [];
			var autoIndex = -1;
			if (req != '') {
				autoIndex = 0;
				listData.push({no: "0", name: req});
			}


			var lists = $(getListData);

			lists.each(function () {
				if (this.name == req) {
					return;
				}
				listData.push(this);
			});

			cb(listData, {autoIndex: autoIndex});
		});
	},
});

var userSelectModel = new OhjicSelect({
	colModel: function (selectBox, $inputObj) {


		var $form = $inputObj.closest('.form-container');
		this.memType = $form.find('input[name=memTypeRadio]:checked').val();
		// var billDate = $form.find('input[name=date]').val();

		// console.dir('------------------------------');
		// console.dir(this);
		// console.dir(this.memType);

		var col = {
			"1": [
				{title: "번호", dataIndx: "no", width: 40, dataType: "String"},
				{title: "봉투번호", dataIndx: "env", width: 40, dataType: "String"},
				{title: "이름", dataIndx: "name", width: 80, dataType: "String"},
				{title: "직분", dataIndx: "p_grade_name", width: 80, dataType: "String"},
				{title: "배우자", dataIndx: "partner_name", width: 80, dataType: "String"},
				{title: "소속1", dataIndx: "depth2_name", width: 80, dataType: "String"},
				{title: "소속2", dataIndx: "depth3_name", width: 80, dataType: "String"},
				{title: "소속3", dataIndx: "depth4_name", width: 80, dataType: "String"},
				{title: "핸드폰", dataIndx: "member_cellphone", width: 100, dataType: "String"},
				{title: "자녀이름", dataIndx: "children", width: 130, dataType: "String"},
			],
			"2": [
				{title: "번호", dataIndx: "no", width: 40, dataType: "String"},
				{title: "봉투번호", dataIndx: "envNo", width: 40, dataType: "String"},
				{title: "거래처명", dataIndx: "name", width: 80, dataType: "String"},
				{title: "연락처", dataIndx: "phone", width: 110, dataType: "String"},
				{title: "사업자번호", dataIndx: "permitNo", width: 50, dataType: "String"},
				{title: "대표자명", dataIndx: "leaderName", width: 70, dataType: "String"},
				{title: "은행", dataIndx: "bankName", width: 80, dataType: "String"},
				{title: "계좌번호", dataIndx: "accountNo", width: 100, dataType: "String"},
				{title: "예금주", dataIndx: "accountHolder", width: 80, dataType: "String"},
			],
			"3": [
				{title: "번호", dataIndx: "no", width: 40, dataType: "String"},
				{title: "봉투번호", dataIndx: "envNo", width: 40, dataType: "String"},
				{title: "구역명", dataIndx: "name", width: 80, dataType: "String"},
				{title: "구역장 성명", dataIndx: "leaderName", width: 80, dataType: "String"},
				{title: "전화번호", dataIndx: "phone", width: 100, dataType: "String"},
				{title: "상세설명", dataIndx: "addr", width: 250, dataType: "String"},
			],
			"4": [
				{title: "번호", dataIndx: "no", width: 40, dataType: "String"},
				{title: "사진", dataIndx: "photo", width: 40, dataType: "image", cls: "pfofile_img"},
				{title: "이름", dataIndx: "name", width: 70, dataType: "String"},
				{title: "상세", dataIndx: "bankName", width: 40, dataType: "String"},
				{title: "생년월일", dataIndx: "birth", width: 110, dataType: "String"},
				{title: "배우자", dataIndx: "partner_name", width: 80, dataType: "String"},
				{title: "핸드폰", dataIndx: "member_cellphone", width: 90, dataType: "String"},
				{title: "소속1", dataIndx: "depth1_name", width: 80, dataType: "String"},
				{title: "소속2", dataIndx: "depth2_name", width: 80, dataType: "String"},
				{title: "소속3", dataIndx: "depth3_name", width: 80, dataType: "String"},
				{title: "자녀이름", dataIndx: "children", width: 130, dataType: "String"},
				{title: "주소", dataIndx: "addr", width: 230, dataType: "String"},
			],
			"0": [
				{title: "이름", dataIndx: "name", width: 400, dataType: "String"},
			]
		};


		if (churchCode == 5814 && this.memType == 1) {
			return col[4];
		} else {
			return col[this.memType];
		}


	},
	delay: 200,
	correct: false,	 // 일치하지 않는 값도 선택할 수 있음
	dropdownMode: true,	// 커서 이동에 따라 input 의 값이 같이 바뀌는 스타일
	dataType: 'remote', // local or remote
	dataModel: function (req, cb) {

		if (typeof (this.xhrRequest) == 'object') {
			this.xhrRequest.abort();
		}

		var param = {
			name: req,
			memType: this.memType
		};

		if (this.memType == 0) {
			cb({name: req});
			return;
		}

		if(/[ㄱ-ㅎ]/.exec(req)){
			// 초성만 입력된 부분이 있다면 검색을 하지 않도록.
			return;
		}

		var self = this;

		this.xhrRequest = $.post('/sList/memberLegendSearch', param, function (getListData) {


			//
			// console.dir(3);
			//
			var listData = [];
			var autoIndex = 0;	// 자동 선택 되는 row 의 index 를 지정.

			var $inputTarget = $(self.selectBoxObj.inputObj);

			var targetType = $inputTarget.attr("targetType") || false;
			var searchTarget = $inputTarget.data('search-target') || 'all';

			var targetOption = targetType !== "member";
			//
			if (param.memType == 1 && churchCode != 5814) {
				if (typeof (id_option) != 'undefined' && id_option == 0 && targetOption) {
					listData.push({no: "0", envNo: "", name: req, message: "무 아이디로 입력 (신원 확인이 안되거나 1회성 입력일 경우 선택)"});
				}
				listData.push({
					no: "New",
					envNo: "New",
					name: req,
					message: "새 아이디 발급 (기존에 재정에 입력한 적이 없을 경우 새로 아이디 추가)"
				});
			} else if (param.memType == 2 || param.memType == 3) {
				if (typeof (id_option) != 'undefined' && id_option == 0 && targetOption) {
					listData.push({
						no: "0",
						envNo: "",
						pid: "",
						name: req,
						message: "무 아이디로 입력 (신원 확인이 안되거나 1회성 입력일 경우 선택)"
					});
				}
				listData.push({
					no: "New",
					envNo: "New",
					pid: "",
					name: req,
					message: "새 아이디 발급 (기존에 재정에 입력한 적이 없을 경우 새로 아이디 추가)"
				});
			}
			//
			var lists = $(getListData);
			//

			if (lists.length == 0) {
				listData.push({message: "<div style='text-align:center;padding:9px;'>검색 결과가 없습니다.</div>"});
				autoIndex = 1;
			} else if (lists.length != 0 && id_option != 0) {
				autoIndex = 1;
			} else {
				autoIndex = 2;
			}
			//
			lists.each(function () {
				var birthDate = this.birth;

				this.birth = birthDate;
				listData.push(this);


			});

			cb(listData, {autoIndex: autoIndex});

			if (churchCode === 5814) {
				$('#selectBox').css({
					top: 0
					, left: 'auto'
					, right: 0
				});
			}


		}, 'json');


	},
	adjust: function (el, data, $inputTarget) {

		var elName = el.attr('name');
		var preFix = elName.indexOf('_') > -1 ? elName.split('_')[0] + '_' : '';
		// var preFix =
		if (data != null) {

			if (data.no > 0) {

				var memType = $('.memTypeRadio:checked').val();

				// console.dir(memType);
				// console.dir(preFix);

				$("#" + preFix + "name1Tag").attr('class', 'memType' + memType);
				$("#" + preFix + "memType").val(memType);
				$("#" + preFix + "pid").val(data.no);
				$("#" + preFix + "tid").val(data.tid);
				$("#" + preFix + "birthYear").val(data.birthYear);
				$("#" + preFix + "birthDay").val(data.birthDay);
				$("#" + preFix + "groupName").val(data.groupName);

				var partner = typeof (data.partner_name) == 'undefined' ? '' : data.partner_name;
				if (inputSeqCheck.seqIndexValue[preFix + 'uName2'] == 1) {
					$("#" + preFix + "uName2").val(partner);
					$("#" + preFix + "uName2").select();
				}
				$("#" + preFix + "info_block").css('display', 'block');
				printAdjustName(data, preFix);


			} else {

				resetName();
			}
		} else {	// selectIndex 가 -1 일땐 아무것도 수행하지 않음.
			resetName();
		}

	},
});
