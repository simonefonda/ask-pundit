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


// Each item must satisfy at least a filter for each facet
function filter() {

    // No filters: everything is active
    if (filters.length === 0) {
        for (var j in st) {
            st[j].active = true;
        }
        return;
    }
    
    // TODO: optimize this
    for (var j in st) {
        var item = st[j],
            checkedFacets = {};

        for (var f in filters) {
            var key = filters[f].key,
                val = filters[f].value;
              
            // First time we see a new key, init the object
            if (typeof(checkedFacets[key]) === 'undefined')
                checkedFacets[key] = false;

            // This item satisfies this filter for this facet
            if (item[key] === val)
                checkedFacets[key] = true;
            
        }
        
        // Finally, check that the checkedFacets object has
        // true in each facet
        activate = true;
        for (var k in checkedFacets) {
            if (checkedFacets[k] === false) {
                activate = false;
            }
        }
        
        item.active = activate;
    }
}

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