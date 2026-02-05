/**
 * Created by tbum on 2017-04-21.
 */



$.fn.extend({
    oSubmit: function (succssFunc, failedFunc) {
        $(this).ajaxSubmit(function (json) {
            try {
                var data = eval('(' + json + ')');
                if (typeof(data.result) != 'undefined' && data.result == true) {	// 성공시
                    succssFunc(data.value);
                } else if (typeof(data.result) != 'undefined' && data.result == false) {	//실패시
                    failedFunc(data.value);
                } else {	// 오류 리포팅을 보냄.
                }
            } catch (e) {

            }

        });
    }
});

$.extend({
    oPost : function (url,param,succssFunc, failedFunc) {

        if(typeof(param)!='object'){
            alert('wrong parameter. parameter only Object.');
            return;
        }
        if(typeof(url) == 'undefined'){
            console.dir('no url');
            return;
        }
        $.post(url,param,function (json) {
            try{

                if(json == ''){
                    console.dir('No response content');
                    return;
                }else{
                    var data = eval('(' + json + ')');
                }
                if (typeof(data.result) != 'undefined' && data.result == true) {	// 성공시
                    succssFunc(data.value);
                } else if (typeof(data.result) != 'undefined' && data.result == false) {	//실패시
                    failedFunc(data.value);
                } else {	// 오류 리포팅을 보냄.
                    console.dir('error post result');
                }

            } catch (e) {
                console.dir(url);
                console.dir(e);
            }

        });
    }
});


$.extend({
    oGet: function (url, param, succssFunc, failedFunc) {

        if (typeof (param) != 'object') {
            alert('wrong parameter. parameter only Object.');
            return;
        }

        $.ajax({
            url: url,
            type: 'GET',
            data: param,
            xhrFields: {withCredentials: true},
            success: function (json) {
                try {
                    var data = eval('(' + json + ')');
                    if (typeof (data.result) != 'undefined' && data.result == true) {	// 성공시
                        succssFunc(data.value);
                    } else if (typeof (data.result) != 'undefined' && data.result == false) {	//실패시
                        if (data.target !== undefined) {
                            failedFunc(data.value, data.target);
                        } else {
                            failedFunc(data.value);
                        }


                    } else if (typeof (data.result) != 'undefined' && data.result == NOT_LOGIN) {
                        alert(data.value);
                        document.location.reload();
                    } else {	// 오류 리포팅을 보냄.
                        console.dir(data);
                        console.dir('error post result');
                    }
                } catch (e) {

                    console.log(e);
                }
            }
        });
    }
});


$.extend({
    frameModal: function (param1) {
        var _targetWin = window;
        var _styleText = '';
        var _contentText = '';
        var _modalWidth = '400px';
        var _modalMinWidth = null;
        var _modalMaxWidth = null;
        var _modalName = 'default';
        var _reload = false;

        var checkParent = function(val){
            var url;
            try{
                url = val.document.location;
            }catch(e){
                val = findTopWin(window);
            }
            return val;
        };

        var findTopWin = function(currentWin){
            var validWin;
            try{
                url = currentWin.parent.document.location;
                validWin = top != currentWin.parent ? findTopWin(currentWin.parent) : top;

            }catch(e){
                validWin = currentWin;
            }
            return validWin;
        }

        var optionParser = function (param1) {
            if(typeof(frameModalTarget) != 'undefined' && frameModalTarget !== null){
                param1.targetWin = frameModalTarget;
            }
            $.each(param1, function (key, val) {
                if (key == 'targetWin') {
                    val = checkParent(val);
                    _targetWin = val;
                } else if (key == 'width') {
                    _modalWidth = val;
                } else if (key == 'minWidth') {
                    _modalMinWidth = val;
                } else if (key == 'maxWidth') {
                    _modalMaxWidth = val;
                } else if (key == 'modalName') {
                    _modalName = val;
                } else if (key == 'html') {
                    _contentText = val;
                } else if (key == 'reload') {
                    _reload = val;
                }
            });
        };

        var initModal = function(){
            // 여러 군데에서 호출해도 실제로 dom 은 하나만 만들도록.
            var customModalName = 'frame_custom_modal_wrap_'+_modalName;
            var modal = _targetWin.$('#'+customModalName).find('.frame_custom_modal');
            if(_reload == false && modal.length > 0){
                return modal;
            }else{
                _targetWin.$('body').find('#'+customModalName).remove();
                _targetWin.$('body').append('<div id="'+customModalName+'">\
                <div class="modal fade frame_custom_modal" tabindex="-1" role="dialog" aria-labelledby="myModalLabel"> \
                        <div class="modal-dialog" role="document"> \
                            <div class="modal-content"> \
                            ' + _contentText + '</div> \
                        </div> \
                    </div>\
                    <style>\
                    ' + _styleText + '</style></div>');

                var modalObject = _targetWin.$('#' + customModalName + ' .frame_custom_modal');
                var modalDialog = modalObject.find('.modal-dialog');
                modalDialog.css('width', _modalWidth);

                if (_modalMinWidth != null) {
                    modalDialog.css('minWidth', _modalMinWidth);
                }
                if (_modalMaxWidth != null) {
                    modalDialog.css('maxWidth', _modalMaxWidth);
                }


                return modalObject;
            }

        };

        var init = function(){

            if(typeof(param1)=='object'){
                optionParser(param1);
            }
            return initModal();

        };

        return init();
    }
});


var tpl_ = (function(){

    var template = new Array();
    var repl = function(tpl,keys,data){

        var value;
        for(var i in keys){
            if(typeof(data[i])=='undefined'){
                data[i] = '';
            }

            value = data[i] == null ? '' : data[i];
            tpl = tpl.split('[['+i+']]').join(value);
        }

        return tpl;
    };

    var find_token = function(tpl,data){
        var s_point = 0;
        var keys = {};
        var s_token = '[[';
        var e_token = ']]';

        while(s_point != -1){
            var s_index = tpl.indexOf(s_token,s_point);

            if(s_index == -1){
                break;
            }
            var e_index = tpl.indexOf(e_token,s_index);

            keys[tpl.substring(s_index+2,e_index)] = 1;

            s_point = e_index;
        }

        return repl(tpl,keys,data);

    };

    return {
        parse : function(template_id,data){
            if(typeof(template[template_id]) == 'undefined'){
                var tpl = $('#'+template_id).html();
            }else{
                tpl = template[template_id];
            }

            if($.trim(tpl) == ''){
                return '';
            }

            return find_token(tpl,data);
        }
    }
})();


function isset(_var) {
    //return window[_var] !== undefined;
    return !!_var;  // converting boolean
}


/*
 *   form 태그의 값들을 javascript object 화 시키는 것
 *
 */
(function($){
    $.fn.serializeObject = function(){

        var self = this,
            json = {},
            push_counters = {},
            patterns = {
                "validate": /^[a-zA-Z][a-zA-Z0-9_]*(?:\[(?:\d*|[a-zA-Z0-9_]+)\])*$/,
                "key":      /[a-zA-Z0-9_]+|(?=\[\])/g,
                "push":     /^$/,
                "fixed":    /^\d+$/,
                "named":    /^[a-zA-Z0-9_]+$/
            };


        this.build = function(base, key, value){
            base[key] = value;
            return base;
        };

        this.push_counter = function(key){
            if(push_counters[key] === undefined){
                push_counters[key] = 0;
            }
            return push_counters[key]++;
        };

        $.each($(this).serializeArray(), function(){

            // skip invalid keys
            if(!patterns.validate.test(this.name)){
                return;
            }

            var k,
                keys = this.name.match(patterns.key),
                merge = this.value,
                reverse_key = this.name;

            while((k = keys.pop()) !== undefined){

                // adjust reverse_key
                reverse_key = reverse_key.replace(new RegExp("\\[" + k + "\\]$"), '');

                // push
                if(k.match(patterns.push)){
                    merge = self.build([], self.push_counter(reverse_key), merge);
                }

                // fixed
                else if(k.match(patterns.fixed)){
                    merge = self.build([], k, merge);
                }

                // named
                else if(k.match(patterns.named)){
                    merge = self.build({}, k, merge);
                }
            }

            json = $.extend(true, json, merge);
        });

        return json;
    };
})(jQuery);


var listController = (function(){
    var _pageNum, _totalPage;
    var _cond = {};
    var _perPage = 40;
    var _orderObj = null;
    var _cfg = {};
    var _order = [];
    var _orderTh = [];

    var _init = function(param){
        _cfg = param;

        if(isset(_cfg.btnNextPage)){
            $(_cfg.btnNextPage).click(function(){
                _nextPage();
            });
        }

        if(isset(_cfg.btnPrevPage)) {
            $(_cfg.btnPrevPage).click(function () {
                _prevPage();
            });
        }

        if(isset(_cfg.initLoad) && _cfg.initLoad == true){
            _formSearch();
        }

        if(!isset(_cfg.perPage)){
            _cfg.perPage = _perPage;
        }

        if(!isset(_cfg.sortableThMemoryCount)){
            _cfg.sortableThMemoryCount = 2;
        }

        if(isset(_cfg.tagSearchForm)){

            $(_cfg.tagSearchForm).submit(function(e){
                e.preventDefault();
                _formSearch();
            });
            return false;
        }
    };

    var _prevPage = function(){

        var nowPage = isset(_cfg.inputNowPageCount) ? $(_cfg.inputNowPageCount).val() : 0;
        if(1 <= parseInt(nowPage) - 1){
            nowPage--;
            _pageNum = nowPage;
            $(_cfg.inputNowPageCount).val(nowPage);
            _getList();
        }
    };

    var _nextPage = function(){

        var nowPage = $(_cfg.inputNowPageCount).val();

        if(parseInt(_totalPage) >= (parseInt(nowPage) + 1)){
            nowPage++;
            _pageNum = nowPage;
            $(_cfg.inputNowPageCount).val(nowPage);
            _getList();
        }
    };

    var _pagination = function(){
        var nowPage = $(_cfg.inputNowPageCount).val();
        _pageNum = nowPage > 0 ? nowPage : 1;
        _getList();
        return false;
    };

    var _setOrder = function(columnName,obj){
        var dir;

        var findIndex = false;
        $.each(_order,function(k,v){
            if(v.column == columnName){
                findIndex = k;
            }
        });

        if(findIndex !== false){
            var findObj = _order.splice(findIndex,1)[0];
            var findTh = _orderTh.splice(findIndex,1)[0];
            dir = findObj.dir == 'az' ? 'za' : 'az';
            findObj.dir = dir;

            _order.unshift(findObj);
            _orderTh.unshift(findTh);

        }else{
            dir = 'az';
            _order.unshift({column:columnName,dir:dir});
            _orderTh.unshift(obj);
        }

        if(_order.length > _cfg.sortableThMemoryCount){
            _order.splice(_cfg.sortableThMemoryCount,1);
            var orderObj = $(_orderTh.splice(_cfg.sortableThMemoryCount,1)[0]);
            orderObj.removeClass('order_az').removeClass('order_za');
        }

        if(typeof(obj) == 'object'){
            $(obj).removeClass('order_az').removeClass('order_za').addClass('order_'+dir);
        }

        _getList();
    };

    var _formSearch = function(){
        if(!isset(_cfg.tagSearchForm)){
            alert('1');
            return false;
        }

        if(typeof(_cfg.onSubmit) != 'undefined'){
            var ret = _cfg.onSubmit(this);
            if(ret == false){
                return;
            }
        }
        $(_cfg.inputNowPageCount).val(1);
        _pageNum = 1;
        _cond = $(_cfg.tagSearchForm).serializeObject();

        if(typeof(_cfg.onBeforeSubmit) == 'function'){
            var ret = _cfg.onBeforeSubmit(_cond);
            if(ret == false){
                return false;
            }
        }



        _getTotalPage();
        _getList();
        return false;
    };


    var _reload = function(){
        _getTotalPage();
        _getList();
    };

    var _getTotalPage = function(){
        var param = {
            cond: _cond
        };

        $.oPost(_cfg.urlTotalCount,param,function(data) {
            var _totalCount = data.cnt;
            _totalPage = Math.ceil(_totalCount/_cfg.perPage);
            if(typeof(_cfg.tagTotalCount) == 'string'){
                $(_cfg.tagTotalCount).html(_totalCount);
            }else if(typeof(_cfg.tagTotalCount) == 'function'){
                _cfg.tagTotalCount(_totalCount);
            }

            if(typeof(_cfg.tagTotalPage) == 'string'){
                $(_cfg.tagTotalPage).html(_totalPage);
            }else if(typeof(_cfg.tagTotalPage) == 'function'){
                _cfg.tagTotalPage(_totalPage);
            }
        });
    };

    var _export = function(mode,target){
        var param = _makeSearchParam();
        param.export = mode;
        param.target = target;

        $.download(_cfg.urlGetList,param,'post');
    };

    var _makeSearchParam = function(){
        var param = {
            cond : _cond
            ,offset : _pageNum
            ,per_page : _cfg.perPage
            ,order : _order
        };
        return param;
    };

    var _getList = function(){
        _pageNum = _pageNum > 0 ? _pageNum : 1;
        _orderObj = new Array();
        var param = _makeSearchParam();

        $.oPost(_cfg.urlGetList,param,function(data){

            var trs = new Array();
            var tpl = '';
            var tbody = '';
            var emptyTpl = '';

            if(typeof(_cfg.onDataLoad) == 'function'){
                data = _cfg.onDataLoad(data);
            }

            if(isset(_cfg.rowTemplateId)){
                tpl = _cfg.rowTemplateId;
            }
            if(isset(_cfg.emptyTemplateId)) {
                emptyTpl = _cfg.emptyTemplateId
            }

            if(isset(_cfg.tagTbody)){
                tbody = _cfg.tagTbody;
            }
            if(data.length == 0 && emptyTpl != '') {
                trs.push($("#"+emptyTpl).html());
            } else {
                $.each(data,function(k,v){
                    trs.push(tpl_.parse(tpl,v));
                });
            }
            trs = trs.join("");

            $(tbody).html(trs);

            _cfg.onListLoad();

        });
    };

    _getCondition = function () {
        return _cond;
    };

    _setConfig = function(key,value){
        _cfg[key] = value;
    };

    return {
        init : _init
        ,getList : _getList
        ,reload : _reload
        ,formSearch : _formSearch
        ,pagination : _pagination
        ,setOrder : _setOrder
        ,getCondition: _getCondition
        ,reload : _reload
        ,export : _export
        ,setConfig : _setConfig
    };
})();



jQuery.download = function(url, data, method) {
    //url and data options required
    if (url && data) {
        //data can be string of parameters or array/object
        //split params into form inputs
        var inputs = '';
        if(data != null){
            $.each(data, function(k,v) {
                if(typeof(v) === 'object' && v != null && typeof(v) != 'undefined'){
                    $.each(v,function(key,val){

                        if(typeof(val) === 'object' && val != null && typeof(val) != 'undefined'){
                            $.each(val,function(key1,val1){
                                inputs += '<input type="hidden" name="' + k +
                                    '['+key+']['+key1+']" value="' + val1 + '" />';
                            });
                        }else if(typeof(val) != 'undefined'){
                            inputs += '<input type="hidden" name="' + k +
                                '['+key+']" value="' + val + '" />';
                        }
                    });
                }else if(typeof(v) != 'undefined'){
                    inputs += '<input type="hidden" name="' + k +
                        '" value="' + v + '" />';
                }
            });
        }

        if(typeof(data.target) != 'undefined' ){
            var target = data.target;
        }else if(data.export == 'excel'){
            var target = "_self";
        }else{
            var target = "_blank";
        }
        //return;
        //send request
        $('<form action="' + url +
            '" method="' + (method || 'post') + '" target="'+target+'">' + inputs + '</form>')
            .appendTo('body').submit().remove();
    }
};





var Widget = (function(){

    var _item = {};
    var _set = function(id){

        var itemBody = $('#'+id);
        if(itemBody == null){
            console.dir('no template id');
            return false;
        }
        var repeats = itemBody.find('[mi-repeat]');
        $.each(repeats,function(i,repeat){
            var repeatObj = $(repeat);
            var repeatType = repeatObj.attr('mi-repeat');
            repeatObj.removeAttr('mi-repeat');
            var repeatParent = $(repeat).parent();
            var tpl = repeatObj.get(0).outerHTML;
            repeatObj.remove();
            if(typeof(_item[id]) === 'undefined'){
                _item[id] = {};
            }
            var keys = _findToken(tpl);
            _item[id][repeatType] = {
                tpl : tpl
                ,key : keys
                ,parent : repeatParent
                ,obj : repeat
            };
        });
    };

    var _findToken = function(tpl){
        var s_point = 0;
        var keys = {};
        var s_token = '[[';
        var e_token = ']]';

        while(s_point != -1){
            var s_index = tpl.indexOf(s_token,s_point);

            if(s_index == -1){
                break;
            }
            var e_index = tpl.indexOf(e_token,s_index);

            keys[tpl.substring(s_index+2,e_index)] = 1;

            s_point = e_index;
        }

        return keys;

    };

    var _add = function(id,item,data,func){

    };

    var _parse = function(id,item,data,func){

        if(typeof(_item[id]) == 'undefined'){
            _set(id);
        }

        if(typeof(_item[id]) == 'undefined'){
            return;
        }

        if(!(typeof(_item[id][item]) != 'undefined')){
            return;
        }

        var key = _item[id][item].key;
        var repeatObj = $(_item[id][item].obj);
        var parentObj = _item[id][item].parent;
        parentObj.html('');
        $.each(data,function(i,v){
            var tpl = _item[id][item].tpl;
            if(typeof(func) === 'function' ){
                v = func(i,v);  // 가공할게 있다면 가공
                if(typeof(v) == 'undefined'){
                    console.dir('template function has no return value');
                }
            }

            $.each(key,function(k,nulll){
                var value;
                if(typeof(v[k]) !== 'undefined'){
                    value =  v[k];
                }else{
                    value = '';
                }

                tpl = tpl.split('[['+k+']]').join(value);
            });

            // repeatObj.after(tpl);
            parentObj.append(tpl);
        });
    };

    return {
        set : _set
        ,parse : _parse
        ,add : _add
    }
})();

if($.ui !== undefined){

    $.widget( "ui.menu",$.ui.menu, {
        version: "1.12.1",
        defaultElement: "<ul>",
        delay: 100000,
        options: {
            icons: {
                submenu: "ui-icon-caret-1-e"
            },
            items: " tbody > *, li",
            menus: "ul",
            position: {
                my: "left top",
                at: "right top"
            },
            role: "menu",

            // Callbacks
            blur: null,
            focus: null,
            select: null
        },

        focus: function( event, item ) {
            var nested, focused, activeParent;
            this.blur( event, event && event.type === "focus" );

            this._scrollIntoView( item );

            this.active = item.first();

            focused = this.active.children( ".ui-menu-item-wrapper" );

            // this._addClass( focused, null, "ui-state-active" );
            focused.addClass('ui-state-active');

            // Only update aria-activedescendant if there's a role
            // otherwise we assume focus is managed elsewhere
            if ( this.options.role ) {
                this.element.attr( "aria-activedescendant", focused.attr( "id" ) );
            }

            // Highlight active parent menu item, if any
            activeParent = this.active
                .parent()
                .closest( ".ui-menu-item" )
                .children( ".ui-menu-item-wrapper" );
            // this._addClass( activeParent, null, "ui-state-active" );
            activeParent.addClass('ui-state-active');

            if ( event && event.type === "keydown" ) {
                this._close();
            } else {
                this.timer = this._delay( function() {
                    this._close();
                }, this.delay );
            }

            nested = item.children( ".ui-menu" );
            if ( nested.length && event && ( /^mouse/.test( event.type ) ) ) {
                this._startOpening( nested );
            }
            this.activeMenu = item.closest('.ui-autocomplete');

            this._trigger( "focus", event, { item: item } );
        },

        isFirstItem: function() {
            return this.active && !this.active.prevAll( ".ui-menu-item" ).length;
        },

        isLastItem: function() {

            return this.active && !this.active.nextAll( ".ui-menu-item" ).length;
        },

        _move: function( direction, filter, event ) {
            var next;
            if ( this.active ) {
                if ( direction === "first" || direction === "last" ) {
                    next = this.active
                        [ direction === "first" ? "prevAll" : "nextAll" ]( ".ui-menu-item" )
                        .eq( -1 );
                } else {
                    next = this.active
                        [ direction + "All" ]( ".ui-menu-item" )
                        .eq( 0 );
                }
            }
            if ( !next || !next.length || !this.active ) {
                next = this.activeMenu.find( this.options.items )[ filter ]();
            }

            this.focus( event, next );
            this._moveScroll(next);
        },
        _moveScroll: function(obj){

            var offsetTop = obj.get(0).offsetTop - 60;
            var ui =obj.closest('.ui-widget');
            ui.find('.scroll-area').scrollTop(offsetTop);
        }
    } );

}


function microtime() {
    var s,now = (Date.now ? Date.now() : new Date().getTime()) / 1000;

    // Dirty trick to only get the integer part
    s = now | 0;

    return  s+(Math.round((now - s) * 1000) / 1000);
}

var MautoComplete = function(config){

    var _opt = {};
    var _autocomplete1 = null;

    _opt.selectCallbackFunc =  typeof(config.onSelect) === 'undefined' ? function(){} : config.onSelect;
    _opt.changeCallbackFunc =  typeof(config.onChange) === 'undefined' ? function(){} : config.onChange;
    _opt.cancelCallbackFunc =  typeof(config.onCancel) === 'undefined' ? function(){} : config.onCancel;
    _opt.targetInput = config.targetInput;
    _opt.source = config.dataSource;
    _opt.columnInfo = config.columnInfo;
    _opt.useHeader = config.useHeader;
    _opt.fullDataShow = config.fullDataShow;
    _opt.correctValue = config.correctValue;
    _opt.maxLength = typeof(config.maxLength) !== 'undefined' ? config.maxLength : 1;
    _opt.icon = typeof(config.icon) !== 'undefined' ? config.icon : '';
    _opt.inputValueObj = null;
    _opt.useCache = typeof(config.useCache) !== 'undefined' ? config.useCache : false;
    _opt.delay = typeof(config.delay) !== 'undefined' ? config.delay : 200;
    _opt.selectedValue = null;
    _opt.selectedName = null;
    _opt.nameKeyName = typeof(config.nameKeyName) !== 'undefined' ? config.nameKeyName : 'data';
    _opt.valueKeyName = typeof(config.valueKeyName) !== 'undefined' ? config.valueKeyName : 'value';
    var _cache = {};

    var _prevValue = '';


    if(typeof _opt.correctValue != 'undefined' && _opt.correctValue == true){
        $(_opt.targetInput).on('blur',function(e){

            if(_opt.selectedValue == null || _opt.selectedValue == ''){
                $(_opt.targetInput).val(_opt.selectedName);
                if(_opt.inputValueObj != null){
                    _opt.inputValueObj.val('');
                }
                _opt.cancelCallbackFunc(e,_opt.targetInput);
            }

        });
    }

    _autocomplete1 = $(_opt.targetInput).autocomplete({
        minLength: _opt.maxLength
        ,delay: _opt.delay
        ,autoFocus :true
        ,source : function(request,response){

            if(_opt.useCache == true && typeof(_cache[request.term]) !== 'undefined'){
                response(_cache[request.term]);
                return;
            }


            _opt.source(request,function(data){
                response(data);

                _cache[request.term] = data;
            });
        }
        ,focus: function( event, ui ) {    // 이 부분없으면 선택 항목 사라짐.

            _opt.selectedValue = $(_opt.targetInput).val();
            _opt.selectedName = $(_opt.inputValueObj).val();

            event.preventDefault(); // without this: keyboard movements reset the input to ''

        },select: function (event, ui) {
            var value,name;

            if(ui.item == null){
                value = '';
                name = '';
            }else{
                value = ui.item[_opt.nameKeyName];
                name = ui.item[_opt.valueKeyName];
            }
            _prevValue = value;
            if(typeof(_opt.correctValue) !== 'undefined' && _opt.correctValue === true){

                setTimeout(function(){
                    $(_opt.targetInput).data('latest-value',value);
                    $(_opt.targetInput).val(name);
                },1);

                if(_opt.inputValueObj != null){
                    _opt.inputValueObj.val(value);
                }

                _opt.selectedValue = value;
                _opt.selectedName = name;
            }

            setTimeout(function(){
                _opt.selectCallbackFunc(event,ui.item);
            },2);


        }
        ,change : function(event ,ui ){
            var value,name;
            if(ui.item == null){
                value = '';
                name = '';
            }else{
                value = ui.item[_opt.nameKeyName];
                name = ui.item[_opt.valueKeyName];
            }
            if(typeof(_opt.correctValue) !== 'undefined' && _opt.correctValue === true){

                $(_opt.targetInput).data('latest-value',value);
                $(_opt.targetInput).val(name);
                if(_opt.inputValueObj != null){
                    _opt.inputValueObj.val(value);
                }
            }
            _opt.changeCallbackFunc(event,ui.item);
        }
        ,open: function(event, ui)
        {
            var ui = _autocomplete1.data( "ui-autocomplete");

        },close : function(){
            var ui = _autocomplete1.data( "ui-autocomplete");
            var item_id = '#ui-id-'+ui.uuid;
            $(item_id+'_wrap').hide();
        }
    }).keydown(function(e){ // 엔터로 submit 되지 않도록 하기 위함.
        if(e.keyCode === 13){
            e.preventDefault();
        }
    });

    if(_autocomplete1.length == 0){
        console.dir('자동 완성 대상이 없습니다.');
        return;
    }

    if(_opt.icon !== ''){
        var inputBox = $(_opt.targetInput);
        var parentDiv = inputBox.wrap("<div class='autocomplete-wrapper'></div>");
        var parent = parentDiv.parent();
        parent.append(_opt.icon);
        var inputName = inputBox.attr('name') === undefined ? '' : inputBox.attr('name');
        var inputId = inputBox.attr('id') === undefined ? '' : inputBox.attr('id');
        inputBox.attr('name',inputName+'_text');
        inputBox.attr('autocomplete','off');
        _opt.inputValueObj = $('<input type="hidden" id="'+inputId+'-value" name="'+inputName+'">').appendTo(parent);
    }else{
        _opt.inputValueObj = null;
    }


    if(typeof(_opt.fullDataShow) !== 'undefined' && _opt.fullDataShow === true){
        $(_opt.targetInput).on('click',function(){
            $(_opt.targetInput).autocomplete( "search", $(_opt.targetInput).val() );
        });

        $(_opt.targetInput).on('focus',function(){
            $(this).select();
        });
    }

    _autocomplete1.data('ui-autocomplete')._renderMenu = function(ul, items) {

        var that = this;
        var thead,fixedHeader,colgroup;
        if(_opt.useHeader == true){

            var col = [];
            var thead = [];
            $.each(_opt.columnInfo,function(k,v){
                col.push(v.width > 0 ? '<col style="width:'+ v.width+'px">' : '<col>');
                thead.push('<td>'+ v.title+'</td>');
            });
            colgroup = '<colgroup>'+col.join('')+'</colgroup>';

            thead = '<thead><tr>'+thead.join('')+'</tr></thead>';
            fixedHeader = '<div class="fixed-header-div"><table class="fixed-header">'+colgroup+'<thead>'+thead+'</thead></table></div>';
        }else{
            thead = '';
            fixedHeader = '';
            colgroup = '';
        }

        ul.append('<div style="position:relative">'+fixedHeader+'<div class="scroll-area"><table class="table_set thead">'+colgroup+''+thead+'<tbody></tbody></table></div></div>');
        $.each( items, function(index, item) {
            that._renderItemData(ul,ul.find('table tbody'), item);
        });
        var $menu = this.menu.element;
        $menu.css('zIndex',3000);

        // setTimeout(function(){
        //     var firstItem = ul.find('.ui-menu-item').first();
        //     console.dir(firstItem);
        //     firstItem.trigger('mouseenter');
        // },100);


    };

    _autocomplete1.data( "ui-autocomplete" )._renderItemData = function(ul,table, item) {
        return this._renderItem( table, item ).data( "ui-autocomplete-item", item );
    };

    _autocomplete1.data( "ui-autocomplete" )._renderItem = function( ul, item ) {
        // ul.css('display','table');

        var td = [];
        var skip = true
        for(var i=0;i<_opt.columnInfo.length && skip;i++) {
            var k = i;
            var v = _opt.columnInfo[i];
            var width = v.width > 0 ? 'width:'+v.width+'px' : '';
            var align = typeof(v.align) !== 'undefined' ? 'text-align:'+v.align+';':';';
            var cellValue = typeof(item[v.column]) == 'undefined' || item[v.column] == null || item[v.column] == 'null' ? '' : item[v.column];

            if(i == item.colspan_start && item.end_to_colspan !== undefined) {
                var tdHTML = '<td colspan="'+(item.end_to_colspan)+'" style="'+align+width+'" >'+ cellValue+'</td>';
                td.push(tdHTML);
                skip = false;
            } else {
                td.push('<td style="' + align + width + '" >' + cellValue + '</td>');
            }
        }
        var className = item.class !== undefined && item.class != '' ? item.class : '';


        var tr = $( "<tr class='"+className+"'></tr>" )
            .data("item.autocomplete", item)
            .addClass('autocomplete_tr')
            .append( td.join('') )
            .appendTo( ul );

        return tr;
    };

    return _autocomplete1;
};

//customize_datepicker object
var customize_datepicker = {

    changeMonth : true,
    changeYear : true,
    dateFormat : 'yymmdd',
    monthNames: ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'],
    monthNamesShort: ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'],
    dayNames: ['일','월','화','수','목','금','토'],
    NamesShort: ['일','월','화','수','목','금','토'],
    dayNamesMin: ['일','월','화','수','목','금','토'],
    showMonthAfterYear: true,
    yearSuffix: '년',
    showButtonPanel: true,
    currentText : '이번 달',
    closeText : '닫기',
//    	onSelect : changeEndDatepicker,
    beforeShow : function(){ setTimeout(function(){ $('.ui-datepicker').css('z-index','3');},10); }
};

// date format translate
Date.prototype.format = function(f) {
    if (!this.valueOf()) return " ";

    var weekName = ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"];
    var d = this;

    return f.replace(/(yyyy|yy|MM|dd|E|hh|mm|ss|a\/p)/gi, function($1) {
        switch ($1) {
            case "yyyy": return d.getFullYear();
            case "yy": return (d.getFullYear() % 1000).zf(2);
            case "MM": return (d.getMonth() + 1).zf(2);
            case "dd": return d.getDate().zf(2);
            case "E": return weekName[d.getDay()];
            case "HH": return d.getHours().zf(2);
            case "hh": return ((h = d.getHours() % 12) ? h : 12).zf(2);
            case "mm": return d.getMinutes().zf(2);
            case "ss": return d.getSeconds().zf(2);
            case "a/p": return d.getHours() < 12 ? "오전" : "오후";
            default: return $1;
        }
    });
};


Number.prototype.format = function(){
    if(this==0) return 0;

    var reg = /(^[+-]?\d+)(\d{3})/;
    var n = (this + '');

    while (reg.test(n)) n = n.replace(reg, '$1' + ',' + '$2');

    return n;
};

// 문자열 타입에서 쓸 수 있도록 format() 함수 추가
String.prototype.format = function(){
    var num = parseFloat(this);
    if( isNaN(num) ) return "0";

    return num.format();
};


String.prototype.string = function(len){var s = '', i = 0; while (i++ < len) { s += this; } return s;};
String.prototype.zf = function(len){return "0".string(len - this.length) + this;};
Number.prototype.zf = function(len){return this.toString().zf(len);};





if (typeof (Cookies) == 'undefined') {
    var Cookies = (function () {
        return {
            get: function () {
            },
            set: function () {
            },
        }
    })();
}


function getQueryStringObject(location) {
    var a = location.search.substr(1).split('&');
    if (a == "") return {};
    var b = {};
    for (var i = 0; i < a.length; ++i) {
        var p = a[i].split('=', 2);
        if (p.length == 1)
            b[p[0]] = "";
        else
            b[p[0]] = decodeURIComponent(p[1].replace(/\+/g, " "));
    }
    return b;
}
function setCookie(name, value, expiredays) {
    var date = new Date();
    date.setDate(date.getDate() + expiredays);
    document.cookie = escape(name) + "=" + escape(value) + "; expires=" + date.toUTCString() +";path=/";
}

function getCookie(name) {
    var cookie = document.cookie;

    if (document.cookie != "") {
        var cookie_array = cookie.split("; ");
        for (var index=0;index<cookie_array.length;index++) {
            var cookie_name = cookie_array[index].split("=");
            if (cookie_name[0] == name) {
                return cookie_name[1];
            }
        }
    }
    return;
}

function maxLengthCheck(object){
    if (object.value.length > object.maxLength){
        object.value = object.value.slice(0, object.maxLength);
    }
}

function getURLPathNameByIndex(index) {
    var parts = window.location.pathname.split("/")
    return parts[index];
}

function numberFormatByCountry(number, countryCode = 'KR') {
    if(countryCode === '' || countryCode == undefined) {
        countryCode = 'KR';
    }
    if (number === null) {
        return '0.00';
    }
    if(typeof number === 'number') {
        number = number.toFixed(2);
    }
    if(number == undefined) {
        number = 0;
    }
    const stringValue = number.toString();
    const parts = stringValue.split('.');

    // If there is a decimal part
    if (parts.length > 1) {
        const integerPart = parts[0];
        const decimalPart = parts[1].slice(0, 2);

        if (countryCode === 'US') {
            return parseFloat(`${integerPart}.${decimalPart}`).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        } else if (countryCode === 'KR') {
            if (decimalPart === '0' || decimalPart === '00') {
                return parseInt(integerPart).toLocaleString('en-US');
            } else {
                return parseFloat(`${integerPart}.${decimalPart}`).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
            }
        }
    } else {
        if(countryCode == 'US') {
            return parseFloat(number).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        } else {
            return parseFloat(number).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        }

    }
}

function truncateToThreeDecimalPlaces(number) {
    if(number == null) {
        return '0.00'
    }
    const stringValue = number.toString();
    const parts = stringValue.split('.');

    if (parts.length === 2) {
        let integerPart = parts[0];
        let decimalPart = parts[1].substring(0, 2);
        if(decimalPart.length == 1) {
            decimalPart += '0';
        }
        return parseFloat(`${integerPart}.${decimalPart}`).toFixed(2);
    } else {
        return number;
    }
}

