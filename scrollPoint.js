/**
 * 该项目根据ui-scrollPoint插件参考开发，但不完全具备其功能，如ui-scrollPoint中的scrollPointAbsolute这个功能是没有的
 */

(function(factory,$,global){

    if(global === undefined || global === null) return;
    if($ === undefined || $ === null) return;
    if(typeof define == 'function' && typeof define.amd == 'object')return define(factory);
    factory && factory(global);

})(function(global,scope){
    global = global || window;
    var edgeType = ["bottom","top"];        //固定界限方向是top或者bottom

    function scrollPoint(option){
        if(this instanceof scrollPoint !== true){
            return new scrollPoint(option);
        }
        this.option = $.extend({},this.defaults,option);
        var el = this.option.el;
        this.$el = el ? el instanceof $ ? el : $(el) :  $('[scroll-point]');
        this.$target = this.option.target || $('.scroll-point-target');
        this.$target = this.$target.length>0 ? this.$target : $(window);
        this.hasTarget = this.$target.length ? true : false;
        if($(this.$el,this.$target).length == 0)this.hasTarget = false;         //判断节点是否在容器当中
        this.$parent = this.$el.parent();
        this.isHited = undefined;               //判断是否
        this.posCache = {};                     //存储当前节点的原始top值
        this.actionsCache = [];                 //存储要执行的函数
        this.initActions();
        this.init();
        return this;
    }

    scrollPoint.prototype.defaults = {
        edge:'top',                     //触发类名变动和函数执行的容器滚动条的滚动界限，形式如："bottom","{bottom:80,top:'-80'}","['top','bottom']"
        customClass:'',                 //要添加或删除的类名，只能是类名字符串
        customAction:null,              //要执行的函数，可以是一个函数或函数数组
        el:null,                         //绑定的节点
        target:null,                    //参考节点
        isInfinite:false                //是否用做无限滚动
    }

    scrollPoint.prototype.getRootHeight = function(){
        return this.hasTarget ? this.$target.height() : getWindowHeight();
    }

    scrollPoint.prototype.getScrollTop = function(){
        return this.hasTarget ? this.$target.scrollTop() : getWindowScrollTop();
    }

    scrollPoint.prototype.getElHeight = function(){
        return this.$el.height();
    }

    scrollPoint.prototype.getElOffSetTop = function(isCache){
        var elTop = isCache && this.posCache.top ? this.posCache.top : this.$el.offset().top;
        var target = this.$target[0];
        var top = target && (target.document || target.nodeType == '9') ? 0 : this.$target.offset().top;
        return this.hasTarget ? (elTop - top) : elTop;
    }

    scrollPoint.prototype.getRootScrollHeight = function(){
        return this.hasTarget ? this.$target[0].scrollHeight - this.$target[0].clientHeight : getWindowScrollHeight();
    }

    scrollPoint.prototype.getRootContentHeight= function(){
        return this.hasTarget ? this.target[0].scrollHeight - this.$target[0].clientHeight : getWindowHeight(true);
    }

    scrollPoint.prototype.getScrollerHeight = function(){
        return this.$target[0].offsetHeight - this.$target[0].clientHeight;
    }

    scrollPoint.prototype.isHit = function(pos){
        var type = pos.type;
        var opera = pos.opera;
        var num = pos.num;
        var isInfinite = this.option.isInfinite;
        var targetHeight = this.getRootHeight();
        var scrollTop = !isInfinite ? this.getScrollTop() : 0;
        var elOffSetTop = this.getElOffSetTop(!isInfinite);
        if(type == "top"){
            if(opera){
                if(opera == "-"){
                    if(scrollTop>=elOffSetTop+num)return true;
                }else if(opera == "+"){
                    if(scrollTop>=elOffSetTop-num)return true;
                }else if(opera == "%"){
                    if(scrollTop>=elOffSetTop*num/100)return true;
                }
            }else{
                if(scrollTop-elOffSetTop>=num)return true;
            }
        }
        if(type == "bottom"){
            elOffSetTop += this.getElHeight();
            if(opera){
                if(opera == "-"){
                    scrollTop += targetHeight;
                    if(scrollTop<=elOffSetTop-num)return true;
                }else if(opera == "+"){
                    scrollTop += targetHeight;
                    if(scrollTop<=elOffSetTop+num)return true;
                }else if(opera == "%"){
                    if(scrollTop<=elOffSetTop*num/100)return true;
                }
            }else{
                if(!isInfinite && scrollTop<=elOffSetTop)return true;
                if(isInfinite && scrollTop>=elOffSetTop)return true;
            }
        }
        return false;
    }
    
    scrollPoint.prototype.scroll = function(pos){
        var customClass = this.option.customClass;
        var canAct = false;
        if(!this.$el.hasClass(customClass) && this.isHited)return;
        if(this.isHit(pos)){
            if(this.isHited)return (this.isHited = true);
            this.option.customAction && this.option.customAction();
            !this.$el.hasClass(customClass) && this.$el.addClass(customClass);
            this.isHited = true;
            canAct = true;
        }else{
            if(this.isHited || this.isHited === undefined){
                this.$el.hasClass(customClass) && this.$el.removeClass(customClass);
                // this.posCache.top = this.$el.offset().top;
                this.isHited = false;
            }
        }
        if(canAct){
            this.actionsCache.map(function(fn){
                fn();
            });
        }
    }

    scrollPoint.prototype.onscroll = function(pos){
        var that = this;
        if(pos instanceof Array){
            pos.map(function(item){
                that.scroll(item);
            })
        }else{
            that.scroll(pos);
        }
    }

    scrollPoint.prototype.initActions = function(){
        var action = this.option.customAction;
        if(typeof action == 'function'){
            this.actionsCache.push(action);
        }
        if(action instanceof Array && action.length){
            this.actionsCache = this.actionsCache.concat(action);
        }
    }

    scrollPoint.prototype.init = function(){
        var that = this;
        var pos = parseEdge(this.option.edge);
        var root = this.hasTarget ? this.$target : $(global);
        this.posCache.top = this.$el.offset().top;
        var left = this.$el.offset().left;
        var width = this.$el.width();
        this.$el.css({'left':left,'width':width});
        this.onscroll(pos);
        root.on('scroll', function(){
            that.onscroll(pos);
        })
    }

    function getWindowScrollTop(){
        if(global.pageYOffset != undefined){
            return global.pageYOffset;
        }else {
            return global.scrollTop;
        }
    }

    function getWindowScrollHeight(){
        return global.document.body.scrollHeight - global.innerHeight;
    }

    function getWindowHeight(isContent){
        return isContent ? global.document.body.clientHeight : global.innerHeight;
    }

    function parseForNum(num,pos){
        var opera;
        num = num.trim();
        num = num.replace(/(^[\-\+]{1})|([\%]{1}$)/g,function(match){
            match && (opera = match);
            return "";
        })
        var isNum = !isNaN(num);
        if(isNum){
            pos.num = parseFloat(num);
            pos.opera = opera;
        }else if(edgeType.indexOf(num)>-1){
            pos.type = num;
        }
    }

    function parseEdge(edge){
        if(!edge)return {type:'top',num:0};
        var pos = {type:'',num:0,opera:""};
        var type = typeof edge;
        if(type == 'string'){
            parseForNum(edge,pos);
        }
        if(type == 'object'){
            if(edge instanceof Array){
                pos.type = [];
                for(var i = 0,len=edge.length,str;str = edge[--len];){
                    edgeType.indexOf(str)>-1 && pos.type.push(str);
                }
            }else{
                pos = [];
                for(var i in edge){
                    if(edgeType.indexOf(i)>-1){
                        tmp = {type:i};
                        typeof edge[i] == 'string' && parseForNum(edge[i],tmp);
                        typeof edge[i] == "number" && (tmp.num = edge[i]);
                        pos.push(tmp);
                    }
                }
            }
            
        }
        if(pos instanceof Array === false){
            pos.type || (pos.type = "top");
            pos.num || (pos.num = 0);
        }
        return pos;
    }

    return (global.scrollPoint = scrollPoint);

},window.jQuery || window.jquery,window)
