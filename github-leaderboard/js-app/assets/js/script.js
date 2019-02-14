var table = null;
BASE_URL = ''
var load_top_contributors = function() {
	var LAMBDA_URL = BASE_URL + '/contributors'
	$.getJSON(LAMBDA_URL , function(data) {
		var tbl_body = "";
		$.each(data, function() {
			var tbl_row = "";
			$.each(this, function(k , v) {
				tbl_row += "<td>"+v+"</td>";
			})
			tbl_body += "<tr>"+tbl_row+"</tr>";
		})
		$("#myTBody").html(tbl_body);
	});
	if (table !== null) {
		table.destroy();
	}
}

var get_rank = function() {
	$("#contributor-form-button").click(function(e) {
		e.preventDefault();
		var username = $("#contributor").val().trim()
		$.ajax({
			type: "GET",
			url: BASE_URL + '/rank/' + username,
			success: function(result) {
				$('.rank-user').text($("#contributor").val().trim())
				if (result.length === 0)
				{
					$('#success-rank').hide()
					$('#fail-rank').show()					
				}else{
					$('#fail-rank').hide()
					$('#success-rank').show()
					$('#rank').text(result[0].Rank)
				}
			},
			error: function(result) {
				alert('error');
			}
		});
	});
} 

$(document).ready(function() {
	load_top_contributors()
	get_rank()
});
