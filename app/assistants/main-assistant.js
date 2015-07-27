function MainAssistant(query) {
	if (typeof(query) != "undefined"){
		this.search(query);
	}
	this.currentDomain = {};
	this.queue = [];
}

MainAssistant.prototype = {
	setup: function(){
		this.listModel = {
			items: []
		};
		this.controller.setupWidget("results-list",
			this.attributes = {
				itemTemplate: "templates/item",
				listTemplate: "templates/list"
	         },
			this.listModel
	    );
		$("spinner").hide();
	},
	search: function(query){
		var q;
		if (typeof(query) != "undefined"){
			q = query;
			$("search").value = q;
		}else{
			q = $("search").value; //query value
		}
		q = q.toLowerCase();
		var url = "https://api.domainr.com/v1/search?client_id={your-mashape-key}&q=" + encodeURIComponent(q);
		var that = this;
		this.toggleSpinner(true);
		this.queue.push(q);
		new Ajax.Request(url, {
			method: 'get',
			evalJSON: 'force',
			onSuccess: that.gotResults.bind(this),
			onFailure: function(r){
				var s = new Services();
				s.exception(r.responseText);
			}
		});
	},
	gotResults: function(response){
		var r = response.responseJSON;
		if (r.results.length > 0){
			for (var i=0; i < this.queue.length; i++) {
				if (this.queue[i] == r.query){
					this.queue.splice(i, 1);
				}
			}
			this.listModel.items = r.results;
			this.controller.modelChanged(this.listModel);
			if (this.queue.length == 0){
				this.toggleSpinner(false);
			}
		}
		else{
			this.listModel.items = [];
			this.controller.modelChanged(this.listModel);
			this.queue = [];
			this.toggleSpinner(false);
		}
	},
	toggleSpinner: function(show){
		if (show){
			$("spinner").show();
		}else{
			$("spinner").hide();
		}
	},
	handleListTap: function(event){
		this.currentDomain = event.item;
		$("title").update(event.item.domain);
		$("message").update(event.item.availability);
		$("details").setStyle({
			"bottom": "0px"
		});
	},
	handleButtonTap: function(event){
		var id = event.srcElement.id;
		switch(id){
			case "close":
				$("details").setStyle({"bottom": "-250px"});
				break;
		}
	},
	activate: function(){
		var that = this;
		$('search').observe('keyup', function(e){
			setTimeout(function(){
				that.search();
			}, 1000);
		});
		this.controller.listen("results-list", Mojo.Event.listTap, this.handleListTap.bind(this));
		this.controller.listen("close", Mojo.Event.tap, this.handleButtonTap.bind(this));
	},
	deactivate: function(){
		this.controller.stopListening("close", Mojo.Event.tap, this.handleButtonTap.bind(this));
		this.controller.stopListening("results-list", Mojo.Event.listTap, this.handleListTap.bind(this));
	}
};
