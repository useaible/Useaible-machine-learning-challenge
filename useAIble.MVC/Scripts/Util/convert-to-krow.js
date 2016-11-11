var oddEvenCounter = 0, trClass;
function toRow(obj, cols, displayFields) {
    if (oddEvenCounter % 2 == 0) {
        trClass = '';
    } else {
        trClass = 'k-alt';
    }
    oddEvenCounter++;
    var html = "<tr role='row' class='" + trClass + "' style='display: table-row;'>";

    //html += "<td class='k-group-cell'>&nbsp;</td>";
    $.each(cols, function (i, v) {
        var field = v.field.replace("[\"", "").replace("\"]", "").replace("\\#", "#");
        var value = (obj[field]) ? obj[field] : '-';
        var valueStr = ""; //(v.format) ? kendo.toString(value, v.format) : value.toString();
        var cssDataClass;
        if (v.format) {
            if (v.format == "p") {
                if (value == "-") {
                    valueStr = value.toString();
                } else {
                    valueStr = kendo.toString(value, "p4");
                }
            } else if (v.format == "t") {
                value = value / 1000;
                if (value = value || 0) {
                    value = kendo.toString(value, "0");
                    valueStr = kendo.toString(value, v.format);
                } else {

                    valueStr = "-"
                }
            }
            else {
                valueStr = kendo.toString(value, v.format);
            }
            cssDataClass = "ValueDataCss";
        } else {
            valueStr = value.toString()
            cssDataClass = "StringDataCss";
        }

        html += "<td role='gridcell' class='" + cssDataClass + "'>" + valueStr + "</td>";
    });

    html += "</tr>";
    
    return html;
}

function toSubtotalRowWithX(obj, cols, displayFields) {
    var html = "<tr class='k-group-footer'>";
    //html += "<td class='k-group-cell'>&nbsp;</td>";

    html += "<td colspan='" + cols.length + "'>";
    html += "<div class='subtotal-div-tag' style='margin-right: 28px;'><span class='subtotal-for-label'>Subtotals for ";
    var isFirst = true;
    $.each(cols, function (i, v) {
        var field = v.field.replace("[\"", "").replace("\"]", "");
        var index = displayFields.indexOf(field);
        if (index < 0) {
            var value = (obj[field]) ? obj[field] : null;
            if (!value) return;
            if (isFirst) {
                html += "</span><span class ='subtotal-for-value'>" + value + "</span>";
                isFirst = false;
            } else {
                html += "&nbsp;,&nbsp;<span class='subtotal-for-value'>" + value + "</span>";
            }
        }
    });
    html += "</div><div style='display: inline; width:200px;'>";
    $.each(displayFields, function (i, v) {
        var format = getFormatFor(v.replace("#", "\\#"), cols);
        var value = (obj[v]) ? obj[v] : '-';
        var valueStr = (format) ? kendo.toString(value, format) : value.toString();
        html += "<div class='subtotal-div-tag'><span class='lines-item-subtotal-labels'>" + v + ":</span> <span class='lines-item-subtotal-value'>" + valueStr + "</span></div>";
    });
    html += "</div></td>";

    html += "</tr>";
    return html;
}

function toSubtotalRow(obj, cols, displayFields) {
    var html = "<tr class='k-group-footer'>";
    //html += "<td class='k-group-cell'>&nbsp;</td>";

    $.each(cols, function (i, v) {
        var field = v.field.replace("[\"", "").replace("\"]", "").replace("\\#", "#");
        var value = "";
        if (obj[field]) {
            value = obj[field];
        } else {
            if (displayFields.indexOf(field) > -1 || field in obj){
                value = "-";
            }
        };

        var valueStr = (v.format) ? kendo.toString(value, v.format) : value.toString();
        var cssDataClass;
        if (displayFields.indexOf(field) > -1) {
            cssDataClass = "ValueDataCss";
        } else {
            cssDataClass = "StringDataCss";

        }
        html += "<td class='" + cssDataClass + "'>" + valueStr + "</td>";
    });

    html += "</tr>";
    return html;
}

function getFormatFor(key, cols) {
    var retVal = null;

    $.each(cols, function (i, v) {
        if (v.field.indexOf(key) > -1) {
            retVal = v.format;
            return false;
        }
    });

    return retVal;
}