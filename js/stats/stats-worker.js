var st = [], 
    filters = [],
    facetList = [];

self.addEventListener('message', function(e) {
    var d = e.data;
    switch (d.cmd) {
        case 'update':
            facetList = d.facetList;
            st = d.st;
            filters = d.filters;
            filter();
            count();
            break;
        case 'start':
            self.postMessage({q: d.cmd, r: 'yayyy'});
            break;
        case 'stop':
            self.postMessage({q: d.cmd, r: 'Closing down? omagad'});
            // self.close();
            break;
        default:
            self.postMessage({q: d.cmd, r: 'Unknown message?! dafuq.'});
    };
}, false);


function filter() {
    for (var j in st) {
        var item = st[j];
        item.active = true;

        for (var f in filters) {
            var key = filters[f].key,
                val = filters[f].value;
    
            // When an item is deactivated, we can safely skip all other 
            // filters for this item
            if (item.active && item[key] === val) {
                item.active = false;
                break;
            }
        }
    }
    
} // filter()

function count() {
    facetsNums = {};
    facetsTotals = {};
    activeTriplesNum = 0;
    
    for (var i in facetList) {
        var key = facetList[i];
        facetsNums[key] = {};
        facetsTotals[key] = {};
    }
    
    for (var j in st) {
        var item = st[j];
        
        if (item.active)
            activeTriplesNum++;
        
        for (var i in facetList) {
            var key = facetList[i],
                val = item[key];

            addCountTotal(key, val);

            if (item.active) {
                addCount(key, val);
            }
        }
    }
    
    self.postMessage({
        cmd: 'update', 
        r: 'New st with '+st.length+' elements, filtered with '+filters.length+' filters',
        st: st,
        activeTriplesNum: activeTriplesNum,
        facetsTotals: facetsTotals,
        facetsNums: facetsNums
    });
    
} // count()

function addCountTotal (key, val) {
    if (val in facetsTotals[key]) {
        facetsTotals[key][val]++;
    } else {
        facetsTotals[key][val] = 1;
    }
}

function addCount(key, val) {
    if (val in facetsNums[key]) {
        facetsNums[key][val]++;
    } else {
        facetsNums[key][val] = 1;
    }
}
