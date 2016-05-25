/**
 * Created by ckj on 2016/4/1.
 */

app.controller( 'sseSelectController', function(renderEngine) {
    var self = this;

    self.onClickItem = function(idx){
        self.result.idx = idx;
        self.result.isopen = false;
    };
    self.content = renderEngine.getPopoverContent();
    self.result = renderEngine.getPopoverResult();
});