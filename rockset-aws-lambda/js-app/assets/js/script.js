var table = null;
function nFormatter(num) {
    if (num >= 1000000000) {
       return (num / 1000000000).toFixed(1).replace(/\.0$/, '') + 'B';
    }
    if (num >= 1000000) {
       return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    }
    if (num >= 1000) {
       return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    }
    return num;
}

var f = function(interval) {
	var LAMBDA_URL = `<my-api-endpoint>?interval=${interval}`;
	$('#hrs').html(interval);
	$.getJSON(LAMBDA_URL , function(data) {
		var tbl_body = "";
		var odd_even = false;
		$.each(data, function() {
			var tbl_row = "";
			$.each(this, function(k , v) {
				if (k === "MarketCap") {
					v = nFormatter(v)
				}
				tbl_row += "<td>"+v+"</td>";
			})
			tbl_body += "<tr class=\""+( odd_even ? "odd" : "even")+"\">"+tbl_row+"</tr>";
			odd_even = !odd_even;               
		})
		$("#myTBody").html(tbl_body);
	});
	if (table !== null) {
		table.destroy();
	}
	table = $('#myTable').DataTable({
		searching: false, 
		paging: false, 
		info: false
	});
}

$(document).ready(function() {
	// another hook
	var handle = $("#custom-handle");
    $("#slider").slider({
      min: 1,
	  max: 1000,
	  value: 2,
      create: function() {
        handle.text( $(this).slider("value"));
      },
      slide: function( event, ui ) {
		handle.text(ui.value);
		f(`${ui.value} hour`)
      }
	});
	f("2 hour")
});