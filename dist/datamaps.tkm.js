(function() {
  var svg;

  // Save off default references
  var d3 = window.d3, topojson = window.topojson;

  var defaultOptions = {
    scope: 'world',
    responsive: false,
    aspectRatio: 0.5625,
    setProjection: setProjection,
    projection: 'equirectangular',
    dataType: 'json',
    data: {},
    done: function() {},
    fills: {
      defaultFill: '#ABDDA4'
    },
    filters: {},
    geographyConfig: {
        dataUrl: null,
        hideAntarctica: true,
        hideHawaiiAndAlaska : false,
        borderWidth: 1,
        borderOpacity: 1,
        borderColor: '#FDFDFD',
        popupTemplate: function(geography, data) {
          return '<div class="hoverinfo"><strong>' + geography.properties.name + '</strong></div>';
        },
        popupOnHover: true,
        highlightOnHover: true,
        highlightFillColor: '#FC8D59',
        highlightBorderColor: 'rgba(250, 15, 160, 0.2)',
        highlightBorderWidth: 2,
        highlightBorderOpacity: 1
    },
    projectionConfig: {
      rotation: [97, 0]
    },
    bubblesConfig: {
        borderWidth: 2,
        borderOpacity: 1,
        borderColor: '#FFFFFF',
        popupOnHover: true,
        radius: null,
        popupTemplate: function(geography, data) {
          return '<div class="hoverinfo"><strong>' + data.name + '</strong></div>';
        },
        fillOpacity: 0.75,
        animate: true,
        highlightOnHover: true,
        highlightFillColor: '#FC8D59',
        highlightBorderColor: 'rgba(250, 15, 160, 0.2)',
        highlightBorderWidth: 2,
        highlightBorderOpacity: 1,
        highlightFillOpacity: 0.85,
        exitDelay: 100,
        key: JSON.stringify
    },
    arcConfig: {
      strokeColor: '#DD1C77',
      strokeWidth: 1,
      arcSharpness: 1,
      animationSpeed: 600,
      popupOnHover: false,
      popupTemplate: function(geography, data) {
        // Case with latitude and longitude
        if ( ( data.origin && data.destination ) && data.origin.latitude && data.origin.longitude && data.destination.latitude && data.destination.longitude ) {
          return '<div class="hoverinfo"><strong>Arc</strong><br>Origin: ' + JSON.stringify(data.origin) + '<br>Destination: ' + JSON.stringify(data.destination) + '</div>';
        }
        // Case with only country name
        else if ( data.origin && data.destination ) {
          return '<div class="hoverinfo"><strong>Arc</strong><br>' + data.origin + ' -> ' + data.destination + '</div>';
        }
        // Missing information
        else {
          return '';
        }
      }
    }
  };

  /*
    Getter for value. If not declared on datumValue, look up the chain into optionsValue
  */
  function val( datumValue, optionsValue, context ) {
    if ( typeof context === 'undefined' ) {
      context = optionsValue;
      optionsValues = undefined;
    }
    var value = typeof datumValue !== 'undefined' ? datumValue : optionsValue;

    if (typeof value === 'undefined') {
      return  null;
    }

    if ( typeof value === 'function' ) {
      var fnContext = [context];
      if ( context.geography ) {
        fnContext = [context.geography, context.data];
      }
      return value.apply(null, fnContext);
    }
    else {
      return value;
    }
  }

  function addContainer( element, height, width ) {
    this.svg = d3.select( element ).append('svg')
      .attr('width', width || element.offsetWidth)
      .attr('data-width', width || element.offsetWidth)
      .attr('class', 'datamap')
      .attr('height', height || element.offsetHeight)
      .style('overflow', 'hidden'); // IE10+ doesn't respect height/width when map is zoomed in

    if (this.options.responsive) {
      d3.select(this.options.element).style({'position': 'relative', 'padding-bottom': (this.options.aspectRatio*100) + '%'});
      d3.select(this.options.element).select('svg').style({'position': 'absolute', 'width': '100%', 'height': '100%'});
      d3.select(this.options.element).select('svg').select('g').selectAll('path').style('vector-effect', 'non-scaling-stroke');

    }

    return this.svg;
  }

  // setProjection takes the svg element and options
  function setProjection( element, options ) {
    var width = options.width || element.offsetWidth;
    var height = options.height || element.offsetHeight;
    var projection, path;
    var svg = this.svg;

    if ( options && typeof options.scope === 'undefined') {
      options.scope = 'world';
    }

    if ( options.scope === 'usa' ) {
      projection = d3.geo.albersUsa()
        .scale(width)
        .translate([width / 2, height / 2]);
    }
    else if ( options.scope === 'world' ) {
      projection = d3.geo[options.projection]()
        .scale((width + 1) / 2 / Math.PI)
        .translate([width / 2, height / (options.projection === "mercator" ? 1.45 : 1.8)]);
    }

    if ( options.projection === 'orthographic' ) {

      svg.append("defs").append("path")
        .datum({type: "Sphere"})
        .attr("id", "sphere")
        .attr("d", path);

      svg.append("use")
          .attr("class", "stroke")
          .attr("xlink:href", "#sphere");

      svg.append("use")
          .attr("class", "fill")
          .attr("xlink:href", "#sphere");
      projection.scale(250).clipAngle(90).rotate(options.projectionConfig.rotation)
    }

    path = d3.geo.path()
      .projection( projection );

    return {path: path, projection: projection};
  }

  function addStyleBlock() {
    if ( d3.select('.datamaps-style-block').empty() ) {
      d3.select('head').append('style').attr('class', 'datamaps-style-block')
      .html('.datamap path.datamaps-graticule { fill: none; stroke: #777; stroke-width: 0.5px; stroke-opacity: .5; pointer-events: none; } .datamap .labels {pointer-events: none;} .datamap path:not(.datamaps-arc), .datamap circle, .datamap line {stroke: #FFFFFF; vector-effect: non-scaling-stroke; stroke-width: 1px;} .datamaps-legend dt, .datamaps-legend dd { float: left; margin: 0 3px 0 0;} .datamaps-legend dd {width: 20px; margin-right: 6px; border-radius: 3px;} .datamaps-legend {padding-bottom: 20px; z-index: 1001; position: absolute; left: 4px; font-size: 12px; font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;} .datamaps-hoverover {display: none; font-family: "Helvetica Neue", Helvetica, Arial, sans-serif; } .hoverinfo {padding: 4px; border-radius: 1px; background-color: #FFF; box-shadow: 1px 1px 5px #CCC; font-size: 12px; border: 1px solid #CCC; } .hoverinfo hr {border:1px dotted #CCC; }');
    }
  }

  function drawSubunits( data ) {
    var fillData = this.options.fills,
        colorCodeData = this.options.data || {},
        geoConfig = this.options.geographyConfig;

    var subunits = this.svg.select('g.datamaps-subunits');
    if ( subunits.empty() ) {
      subunits = this.addLayer('datamaps-subunits', null, true);
    }

    var geoData = topojson.feature( data, data.objects[ this.options.scope ] ).features;
    if ( geoConfig.hideAntarctica ) {
      geoData = geoData.filter(function(feature) {
        return feature.id !== "ATA";
      });
    }

    if ( geoConfig.hideHawaiiAndAlaska ) {
      geoData = geoData.filter(function(feature) {
        return feature.id !== "HI" && feature.id !== 'AK';
      });
    }

    var geo = subunits.selectAll('path.datamaps-subunit').data( geoData );

    geo.enter()
      .append('path')
      .attr('d', this.path)
      .attr('class', function(d) {
        return 'datamaps-subunit ' + d.id;
      })
      .attr('data-info', function(d) {
        return JSON.stringify( colorCodeData[d.id]);
      })
      .style('fill', function(d) {
        // If fillKey - use that
        // Otherwise check 'fill'
        // Otherwise check 'defaultFill'
        var fillColor;

        var datum = colorCodeData[d.id];
        if ( datum && datum.fillKey ) {
          fillColor = fillData[ val(datum.fillKey, {data: colorCodeData[d.id], geography: d}) ];
        }

        if ( typeof fillColor === 'undefined' ) {
          fillColor = val(datum && datum.fillColor, fillData.defaultFill, {data: colorCodeData[d.id], geography: d});
        }

        return fillColor;
      })
      .style('stroke-width', geoConfig.borderWidth)
      .style('stroke-opacity', geoConfig.borderOpacity)
      .style('stroke', geoConfig.borderColor);
  }

  function handleGeographyConfig () {
    var hoverover;
    var svg = this.svg;
    var self = this;
    var options = this.options.geographyConfig;

    if ( options.highlightOnHover || options.popupOnHover ) {
      svg.selectAll('.datamaps-subunit')
        .on('mouseover', function(d) {
          var $this = d3.select(this);
          var datum = self.options.data[d.id] || {};
          if ( options.highlightOnHover ) {
            var previousAttributes = {
              'fill':  $this.style('fill'),
              'stroke': $this.style('stroke'),
              'stroke-width': $this.style('stroke-width'),
              'fill-opacity': $this.style('fill-opacity')
            };

            $this
              .style('fill', val(datum.highlightFillColor, options.highlightFillColor, datum))
              .style('stroke', val(datum.highlightBorderColor, options.highlightBorderColor, datum))
              .style('stroke-width', val(datum.highlightBorderWidth, options.highlightBorderWidth, datum))
              .style('stroke-opacity', val(datum.highlightBorderOpacity, options.highlightBorderOpacity, datum))
              .style('fill-opacity', val(datum.highlightFillOpacity, options.highlightFillOpacity, datum))
              .attr('data-previousAttributes', JSON.stringify(previousAttributes));

            // As per discussion on https://github.com/markmarkoh/datamaps/issues/19
            if ( ! /((MSIE)|(Trident)|(Edge))/.test(navigator.userAgent) ) {
             moveToFront.call(this);
            }
          }

          if ( options.popupOnHover ) {
            self.updatePopup($this, d, options, svg);
          }
        })
        .on('mouseout', function() {
          var $this = d3.select(this);

          if (options.highlightOnHover) {
            // Reapply previous attributes
            var previousAttributes = JSON.parse( $this.attr('data-previousAttributes') );
            for ( var attr in previousAttributes ) {
              $this.style(attr, previousAttributes[attr]);
            }
          }
          $this.on('mousemove', null);
          d3.selectAll('.datamaps-hoverover').style('display', 'none');
        });
    }

    function moveToFront() {
      this.parentNode.appendChild(this);
    }
  }

  // Plugin to add a simple map legend
  function addLegend(layer, data, options) {
    data = data || {};
    if ( !this.options.fills ) {
      return;
    }

    var html = '<dl>';
    var label = '';
    if ( data.legendTitle ) {
      html = '<h2>' + data.legendTitle + '</h2>' + html;
    }
    for ( var fillKey in this.options.fills ) {

      if ( fillKey === 'defaultFill') {
        if (! data.defaultFillName ) {
          continue;
        }
        label = data.defaultFillName;
      } else {
        if (data.labels && data.labels[fillKey]) {
          label = data.labels[fillKey];
        } else {
          label= fillKey + ': ';
        }
      }
      html += '<dt>' + label + '</dt>';
      html += '<dd style="background-color:' +  this.options.fills[fillKey] + '">&nbsp;</dd>';
    }
    html += '</dl>';

    var hoverover = d3.select( this.options.element ).append('div')
      .attr('class', 'datamaps-legend')
      .html(html);
  }

    function addGraticule ( layer, options ) {
      var graticule = d3.geo.graticule();
      this.svg.insert("path", '.datamaps-subunits')
        .datum(graticule)
        .attr("class", "datamaps-graticule")
        .attr("d", this.path);
  }

  function handleArcs (layer, data, options) {
    var self = this,
        svg = this.svg;

    if ( !data || (data && !data.slice) ) {
      throw "Datamaps Error - arcs must be an array";
    }

    // For some reason arc options were put in an `options` object instead of the parent arc
    // I don't like this, so to match bubbles and other plugins I'm moving it
    // This is to keep backwards compatability
    for ( var i = 0; i < data.length; i++ ) {
      data[i] = defaults(data[i], data[i].options);
      delete data[i].options;
    }

    if ( typeof options === "undefined" ) {
      options = defaultOptions.arcConfig;
    }

    var arcs = layer.selectAll('path.datamaps-arc').data( data, JSON.stringify );

    var path = d3.geo.path()
        .projection(self.projection);

    arcs
      .enter()
        .append('svg:path')
        .attr('class', 'datamaps-arc')
        .style('stroke-linecap', 'round')
        .style('stroke', function(datum) {
          return val(datum.strokeColor, options.strokeColor, datum);
        })
        .style('fill', 'none')
        .style('stroke-width', function(datum) {
            return val(datum.strokeWidth, options.strokeWidth, datum);
        })
        .attr('d', function(datum) {

            var originXY, destXY;

            if (typeof datum.origin === "string") {
              switch (datum.origin) {
                   case "CAN":
                       originXY = self.latLngToXY(56.624472, -114.665293);
                       break;
                   case "CHL":
                       originXY = self.latLngToXY(-33.448890, -70.669265);
                       break;
                   case "HRV":
                       originXY = self.latLngToXY(45.815011, 15.981919);
                       break;
                   case "IDN":
                       originXY = self.latLngToXY(-6.208763, 106.845599);
                       break;
                   case "JPN":
                       originXY = self.latLngToXY(35.689487, 139.691706);
                       break;
                   case "MYS":
                       originXY = self.latLngToXY(3.139003, 101.686855);
                       break;
                   case "NOR":
                       originXY = self.latLngToXY(59.913869, 10.752245);
                       break;
                   case "USA":
                       originXY = self.latLngToXY(41.140276, -100.760145);
                       break;
                   case "VNM":
                       originXY = self.latLngToXY(21.027764, 105.834160);
                       break;
                   default:
                       originXY = self.path.centroid(svg.select('path.' + datum.origin).data()[0]);
               }
            } else {
              originXY = self.latLngToXY(val(datum.origin.latitude, datum), val(datum.origin.longitude, datum))
            }

            if (typeof datum.destination === 'string') {
              switch (datum.destination) {
                    case "CAN":
                        destXY = self.latLngToXY(56.624472, -114.665293);
                        break;
                    case "CHL":
                        destXY = self.latLngToXY(-33.448890, -70.669265);
                        break;
                    case "HRV":
                        destXY = self.latLngToXY(45.815011, 15.981919);
                        break;
                    case "IDN":
                        destXY = self.latLngToXY(-6.208763, 106.845599);
                        break;
                    case "JPN":
                        destXY = self.latLngToXY(35.689487, 139.691706);
                        break;
                    case "MYS":
                        destXY = self.latLngToXY(3.139003, 101.686855);
                        break;
                    case "NOR":
                        destXY = self.latLngToXY(59.913869, 10.752245);
                        break;
                    case "USA":
                        destXY = self.latLngToXY(41.140276, -100.760145);
                        break;
                    case "VNM":
                        destXY = self.latLngToXY(21.027764, 105.834160);
                        break;
                    default:
                        destXY = self.path.centroid(svg.select('path.' + datum.destination).data()[0]);
              }
            } else {
              destXY = self.latLngToXY(val(datum.destination.latitude, datum), val(datum.destination.longitude, datum));
            }
            var midXY = [ (originXY[0] + destXY[0]) / 2, (originXY[1] + destXY[1]) / 2];
            if (options.greatArc) {
                  // TODO: Move this to inside `if` clause when setting attr `d`
              var greatArc = d3.geo.greatArc()
                  .source(function(d) { return [val(d.origin.longitude, d), val(d.origin.latitude, d)]; })
                  .target(function(d) { return [val(d.destination.longitude, d), val(d.destination.latitude, d)]; });

              return path(greatArc(datum))
            }
            var sharpness = val(datum.arcSharpness, options.arcSharpness, datum);
            return "M" + originXY[0] + ',' + originXY[1] + "S" + (midXY[0] + (50 * sharpness)) + "," + (midXY[1] - (75 * sharpness)) + "," + destXY[0] + "," + destXY[1];
        })
        .attr('data-info', function(datum) {
          return JSON.stringify(datum);
        })
        .on('mouseover', function ( datum ) {
          var $this = d3.select(this);

          if (options.popupOnHover) {
            self.updatePopup($this, datum, options, svg);
          }
        })
        .on('mouseout', function ( datum ) {
          var $this = d3.select(this);

          d3.selectAll('.datamaps-hoverover').style('display', 'none');
        })
        .transition()
          .delay(100)
          .style('fill', function(datum) {
            /*
              Thank you Jake Archibald, this is awesome.
              Source: http://jakearchibald.com/2013/animated-line-drawing-svg/
            */
            var length = this.getTotalLength();
            this.style.transition = this.style.WebkitTransition = 'none';
            this.style.strokeDasharray = length + ' ' + length;
            this.style.strokeDashoffset = length;
            this.getBoundingClientRect();
            this.style.transition = this.style.WebkitTransition = 'stroke-dashoffset ' + val(datum.animationSpeed, options.animationSpeed, datum) + 'ms ease-out';
            this.style.strokeDashoffset = '0';
            return 'none';
          })

    arcs.exit()
      .transition()
      .style('opacity', 0)
      .remove();
  }

  function handleLabels ( layer, options ) {
    var self = this;
    options = options || {};
    var labelStartCoodinates = this.projection([-67.707617, 42.722131]);
    this.svg.selectAll(".datamaps-subunit")
      .attr("data-foo", function(d) {
        var center = self.path.centroid(d);
        var xOffset = 7.5, yOffset = 5;

        if ( ["FL", "KY", "MI"].indexOf(d.id) > -1 ) xOffset = -2.5;
        if ( d.id === "NY" ) xOffset = -1;
        if ( d.id === "MI" ) yOffset = 18;
        if ( d.id === "LA" ) xOffset = 13;

        var x,y;

        x = center[0] - xOffset;
        y = center[1] + yOffset;

        var smallStateIndex = ["VT", "NH", "MA", "RI", "CT", "NJ", "DE", "MD", "DC"].indexOf(d.id);
        if ( smallStateIndex > -1) {
          var yStart = labelStartCoodinates[1];
          x = labelStartCoodinates[0];
          y = yStart + (smallStateIndex * (2+ (options.fontSize || 12)));
          layer.append("line")
            .attr("x1", x - 3)
            .attr("y1", y - 5)
            .attr("x2", center[0])
            .attr("y2", center[1])
            .style("stroke", options.labelColor || "#000")
            .style("stroke-width", options.lineWidth || 1)
        }

          layer.append("text")
              .attr("x", x)
              .attr("y", y)
              .style("font-size", (options.fontSize || 10) + 'px')
              .style("font-family", options.fontFamily || "Verdana")
              .style("fill", options.labelColor || "#000")
              .text(function() {
                  if (options.customLabelText && options.customLabelText[d.id]) {
                      return options.customLabelText[d.id]
                  } else {
                      return d.id
                  }
              });

        return "bar";
      });
  }


  function handleBubbles (layer, data, options ) {
    var self = this,
        fillData = this.options.fills,
        filterData = this.options.filters,
        svg = this.svg;

    if ( !data || (data && !data.slice) ) {
      throw "Datamaps Error - bubbles must be an array";
    }

    var bubbles = layer.selectAll('circle.datamaps-bubble').data( data, options.key );

    bubbles
      .enter()
        .append('svg:circle')
        .attr('class', 'datamaps-bubble')
        .attr('cx', function ( datum ) {
          var latLng;
          if ( datumHasCoords(datum) ) {
            latLng = self.latLngToXY(datum.latitude, datum.longitude);
          }
          else if ( datum.centered ) {
            if ( datum.centered === 'USA' ) {
              latLng = self.projection([-98.58333, 39.83333])
            } else {
              latLng = self.path.centroid(svg.select('path.' + datum.centered).data()[0]);
            }
          }
          if ( latLng ) return latLng[0];
        })
        .attr('cy', function ( datum ) {
          var latLng;
          if ( datumHasCoords(datum) ) {
            latLng = self.latLngToXY(datum.latitude, datum.longitude);
          }
          else if ( datum.centered ) {
            if ( datum.centered === 'USA' ) {
              latLng = self.projection([-98.58333, 39.83333])
            } else {
              latLng = self.path.centroid(svg.select('path.' + datum.centered).data()[0]);
            }
          }
          if ( latLng ) return latLng[1];
        })
        .attr('r', function(datum) {
          // If animation enabled start with radius 0, otherwise use full size.
          return options.animate ? 0 : val(datum.radius, options.radius, datum);
        })
        .attr('data-info', function(datum) {
          return JSON.stringify(datum);
        })
        .attr('filter', function (datum) {
          var filterKey = filterData[ val(datum.filterKey, options.filterKey, datum) ];

          if (filterKey) {
            return filterKey;
          }
        })
        .style('stroke', function ( datum ) {
          return val(datum.borderColor, options.borderColor, datum);
        })
        .style('stroke-width', function ( datum ) {
          return val(datum.borderWidth, options.borderWidth, datum);
        })
        .style('stroke-opacity', function ( datum ) {
          return val(datum.borderOpacity, options.borderOpacity, datum);
        })
        .style('fill-opacity', function ( datum ) {
          return val(datum.fillOpacity, options.fillOpacity, datum);
        })
        .style('fill', function ( datum ) {
          var fillColor = fillData[ val(datum.fillKey, options.fillKey, datum) ];
          return fillColor || fillData.defaultFill;
        })
        .on('mouseover', function ( datum ) {
          var $this = d3.select(this);

          if (options.highlightOnHover) {
            // Save all previous attributes for mouseout
            var previousAttributes = {
              'fill':  $this.style('fill'),
              'stroke': $this.style('stroke'),
              'stroke-width': $this.style('stroke-width'),
              'fill-opacity': $this.style('fill-opacity')
            };

            $this
              .style('fill', val(datum.highlightFillColor, options.highlightFillColor, datum))
              .style('stroke', val(datum.highlightBorderColor, options.highlightBorderColor, datum))
              .style('stroke-width', val(datum.highlightBorderWidth, options.highlightBorderWidth, datum))
              .style('stroke-opacity', val(datum.highlightBorderOpacity, options.highlightBorderOpacity, datum))
              .style('fill-opacity', val(datum.highlightFillOpacity, options.highlightFillOpacity, datum))
              .attr('data-previousAttributes', JSON.stringify(previousAttributes));
          }

          if (options.popupOnHover) {
            self.updatePopup($this, datum, options, svg);
          }
        })
        .on('mouseout', function ( datum ) {
          var $this = d3.select(this);

          if (options.highlightOnHover) {
            // Reapply previous attributes
            var previousAttributes = JSON.parse( $this.attr('data-previousAttributes') );
            for ( var attr in previousAttributes ) {
              $this.style(attr, previousAttributes[attr]);
            }
          }

          d3.selectAll('.datamaps-hoverover').style('display', 'none');
        })

    bubbles.transition()
      .duration(400)
      .attr('r', function ( datum ) {
        return val(datum.radius, options.radius, datum);
      })
    .transition()
      .duration(0)
      .attr('data-info', function(d) {
        return JSON.stringify(d);
      });

    bubbles.exit()
      .transition()
        .delay(options.exitDelay)
        .attr("r", 0)
        .remove();

    function datumHasCoords (datum) {
      return typeof datum !== 'undefined' && typeof datum.latitude !== 'undefined' && typeof datum.longitude !== 'undefined';
    }
  }

  function defaults(obj) {
    Array.prototype.slice.call(arguments, 1).forEach(function(source) {
      if (source) {
        for (var prop in source) {
          // Deep copy if property not set
          if (obj[prop] == null) {
            if (typeof source[prop] == 'function') {
              obj[prop] = source[prop];
            }
            else {
              obj[prop] = JSON.parse(JSON.stringify(source[prop]));
            }
          }
        }
      }
    });
    return obj;
  }
  /**************************************
             Public Functions
  ***************************************/

  function Datamap( options ) {

    if ( typeof d3 === 'undefined' || typeof topojson === 'undefined' ) {
      throw new Error('Include d3.js (v3.0.3 or greater) and topojson on this page before creating a new map');
   }
    // Set options for global use
    this.options = defaults(options, defaultOptions);
    this.options.geographyConfig = defaults(options.geographyConfig, defaultOptions.geographyConfig);
    this.options.projectionConfig = defaults(options.projectionConfig, defaultOptions.projectionConfig);
    this.options.bubblesConfig = defaults(options.bubblesConfig, defaultOptions.bubblesConfig);
    this.options.arcConfig = defaults(options.arcConfig, defaultOptions.arcConfig);

    // Add the SVG container
    if ( d3.select( this.options.element ).select('svg').length > 0 ) {
      addContainer.call(this, this.options.element, this.options.height, this.options.width );
    }

    // Add core plugins to this instance
    this.addPlugin('bubbles', handleBubbles);
    this.addPlugin('legend', addLegend);
    this.addPlugin('arc', handleArcs);
    this.addPlugin('labels', handleLabels);
    this.addPlugin('graticule', addGraticule);

    // Append style block with basic hoverover styles
    if ( ! this.options.disableDefaultStyles ) {
      addStyleBlock();
    }

    return this.draw();
  }

  // Resize map
  Datamap.prototype.resize = function () {

    var self = this;
    var options = self.options;

    if (options.responsive) {
      var newsize = options.element.clientWidth,
          oldsize = d3.select( options.element).select('svg').attr('data-width');

      d3.select(options.element).select('svg').selectAll('g').attr('transform', 'scale(' + (newsize / oldsize) + ')');
    }
  }

  // Actually draw the features(states & countries)
  Datamap.prototype.draw = function() {
    // Save off in a closure
    var self = this;
    var options = self.options;

    // Set projections and paths based on scope
    var pathAndProjection = options.setProjection.apply(this, [options.element, options] );

    this.path = pathAndProjection.path;
    this.projection = pathAndProjection.projection;

    // If custom URL for topojson data, retrieve it and render
    if ( options.geographyConfig.dataUrl ) {
      d3.json( options.geographyConfig.dataUrl, function(error, results) {
        if ( error ) throw new Error(error);
        self.customTopo = results;
        draw( results );
      });
    }
    else {
      draw( this[options.scope + 'Topo'] || options.geographyConfig.dataJson);
    }

    return this;

      function draw (data) {
        // If fetching remote data, draw the map first then call `updateChoropleth`
        if ( self.options.dataUrl ) {
          // Allow for csv or json data types
          d3[self.options.dataType](self.options.dataUrl, function(data) {
            // In the case of csv, transform data to object
            if ( self.options.dataType === 'csv' && (data && data.slice) ) {
              var tmpData = {};
              for(var i = 0; i < data.length; i++) {
                tmpData[data[i].id] = data[i];
              }
              data = tmpData;
            }
            Datamaps.prototype.updateChoropleth.call(self, data);
          });
        }
        drawSubunits.call(self, data);
        handleGeographyConfig.call(self);

        if ( self.options.geographyConfig.popupOnHover || self.options.bubblesConfig.popupOnHover) {
          hoverover = d3.select( self.options.element ).append('div')
            .attr('class', 'datamaps-hoverover')
            .style('z-index', 10001)
            .style('position', 'absolute');
        }

        // Fire off finished callback
        self.options.done(self);
      }
  };
  /**************************************
                TopoJSON
  ***************************************/
  Datamap.prototype.worldTopo = '__WORLD__';
  Datamap.prototype.abwTopo = '__ABW__';
  Datamap.prototype.afgTopo = '__AFG__';
  Datamap.prototype.agoTopo = '__AGO__';
  Datamap.prototype.aiaTopo = '__AIA__';
  Datamap.prototype.albTopo = '__ALB__';
  Datamap.prototype.aldTopo = '__ALD__';
  Datamap.prototype.andTopo = '__AND__';
  Datamap.prototype.areTopo = '__ARE__';
  Datamap.prototype.argTopo = '__ARG__';
  Datamap.prototype.armTopo = '__ARM__';
  Datamap.prototype.asmTopo = '__ASM__';
  Datamap.prototype.ataTopo = '__ATA__';
  Datamap.prototype.atcTopo = '__ATC__';
  Datamap.prototype.atfTopo = '__ATF__';
  Datamap.prototype.atgTopo = '__ATG__';
  Datamap.prototype.ausTopo = '__AUS__';
  Datamap.prototype.autTopo = '__AUT__';
  Datamap.prototype.azeTopo = '__AZE__';
  Datamap.prototype.bdiTopo = '__BDI__';
  Datamap.prototype.belTopo = '__BEL__';
  Datamap.prototype.benTopo = '__BEN__';
  Datamap.prototype.bfaTopo = '__BFA__';
  Datamap.prototype.bgdTopo = '__BGD__';
  Datamap.prototype.bgrTopo = '__BGR__';
  Datamap.prototype.bhrTopo = '__BHR__';
  Datamap.prototype.bhsTopo = '__BHS__';
  Datamap.prototype.bihTopo = '__BIH__';
  Datamap.prototype.bjnTopo = '__BJN__';
  Datamap.prototype.blmTopo = '__BLM__';
  Datamap.prototype.blrTopo = '__BLR__';
  Datamap.prototype.blzTopo = '__BLZ__';
  Datamap.prototype.bmuTopo = '__BMU__';
  Datamap.prototype.bolTopo = '__BOL__';
  Datamap.prototype.braTopo = '__BRA__';
  Datamap.prototype.brbTopo = '__BRB__';
  Datamap.prototype.brnTopo = '__BRN__';
  Datamap.prototype.btnTopo = '__BTN__';
  Datamap.prototype.norTopo = '__NOR__';
  Datamap.prototype.bwaTopo = '__BWA__';
  Datamap.prototype.cafTopo = '__CAF__';
  Datamap.prototype.canTopo = '__CAN__';
  Datamap.prototype.cheTopo = '__CHE__';
  Datamap.prototype.chlTopo = '__CHL__';
  Datamap.prototype.chnTopo = '__CHN__';
  Datamap.prototype.civTopo = '__CIV__';
  Datamap.prototype.clpTopo = '__CLP__';
  Datamap.prototype.cmrTopo = '__CMR__';
  Datamap.prototype.codTopo = '__COD__';
  Datamap.prototype.cogTopo = '__COG__';
  Datamap.prototype.cokTopo = '__COK__';
  Datamap.prototype.colTopo = '__COL__';
  Datamap.prototype.comTopo = '__COM__';
  Datamap.prototype.cpvTopo = '__CPV__';
  Datamap.prototype.criTopo = '__CRI__';
  Datamap.prototype.csiTopo = '__CSI__';
  Datamap.prototype.cubTopo = '__CUB__';
  Datamap.prototype.cuwTopo = '__CUW__';
  Datamap.prototype.cymTopo = '__CYM__';
  Datamap.prototype.cynTopo = '__CYN__';
  Datamap.prototype.cypTopo = '__CYP__';
  Datamap.prototype.czeTopo = '__CZE__';
  Datamap.prototype.deuTopo = '__DEU__';
  Datamap.prototype.djiTopo = '__DJI__';
  Datamap.prototype.dmaTopo = '__DMA__';
  Datamap.prototype.dnkTopo = '__DNK__';
  Datamap.prototype.domTopo = '__DOM__';
  Datamap.prototype.dzaTopo = '__DZA__';
  Datamap.prototype.ecuTopo = '__ECU__';
  Datamap.prototype.egyTopo = '__EGY__';
  Datamap.prototype.eriTopo = '__ERI__';
  Datamap.prototype.esbTopo = '__ESB__';
  Datamap.prototype.espTopo = '__ESP__';
  Datamap.prototype.estTopo = '__EST__';
  Datamap.prototype.ethTopo = '__ETH__';
  Datamap.prototype.finTopo = '__FIN__';
  Datamap.prototype.fjiTopo = '__FJI__';
  Datamap.prototype.flkTopo = '__FLK__';
  Datamap.prototype.fraTopo = '__FRA__';
  Datamap.prototype.froTopo = '__FRO__';
  Datamap.prototype.fsmTopo = '__FSM__';
  Datamap.prototype.gabTopo = '__GAB__';
  Datamap.prototype.psxTopo = '__PSX__';
  Datamap.prototype.gbrTopo = '__GBR__';
  Datamap.prototype.geoTopo = '__GEO__';
  Datamap.prototype.ggyTopo = '__GGY__';
  Datamap.prototype.ghaTopo = '__GHA__';
  Datamap.prototype.gibTopo = '__GIB__';
  Datamap.prototype.ginTopo = '__GIN__';
  Datamap.prototype.gmbTopo = '__GMB__';
  Datamap.prototype.gnbTopo = '__GNB__';
  Datamap.prototype.gnqTopo = '__GNQ__';
  Datamap.prototype.grcTopo = '__GRC__';
  Datamap.prototype.grdTopo = '__GRD__';
  Datamap.prototype.grlTopo = '__GRL__';
  Datamap.prototype.gtmTopo = '__GTM__';
  Datamap.prototype.gumTopo = '__GUM__';
  Datamap.prototype.guyTopo = '__GUY__';
  Datamap.prototype.hkgTopo = '__HKG__';
  Datamap.prototype.hmdTopo = '__HMD__';
  Datamap.prototype.hndTopo = '__HND__';
  Datamap.prototype.hrvTopo = '__HRV__';
  Datamap.prototype.htiTopo = '__HTI__';
  Datamap.prototype.hunTopo = '__HUN__';
  Datamap.prototype.idnTopo = '__IDN__';
  Datamap.prototype.imnTopo = '__IMN__';
  Datamap.prototype.indTopo = '__IND__';
  Datamap.prototype.ioaTopo = '__IOA__';
  Datamap.prototype.iotTopo = '__IOT__';
  Datamap.prototype.irlTopo = '__IRL__';
  Datamap.prototype.irnTopo = '__IRN__';
  Datamap.prototype.irqTopo = '__IRQ__';
  Datamap.prototype.islTopo = '__ISL__';
  Datamap.prototype.isrTopo = '__ISR__';
  Datamap.prototype.itaTopo = '__ITA__';
  Datamap.prototype.jamTopo = '__JAM__';
  Datamap.prototype.jeyTopo = '__JEY__';
  Datamap.prototype.jorTopo = '__JOR__';
  Datamap.prototype.jpnTopo = '__JPN__';
  Datamap.prototype.kabTopo = '__KAB__';
  Datamap.prototype.kasTopo = '__KAS__';
  Datamap.prototype.kazTopo = '__KAZ__';
  Datamap.prototype.kenTopo = '__KEN__';
  Datamap.prototype.kgzTopo = '__KGZ__';
  Datamap.prototype.khmTopo = '__KHM__';
  Datamap.prototype.kirTopo = '__KIR__';
  Datamap.prototype.knaTopo = '__KNA__';
  Datamap.prototype.korTopo = '__KOR__';
  Datamap.prototype.kosTopo = '__KOS__';
  Datamap.prototype.kwtTopo = '__KWT__';
  Datamap.prototype.laoTopo = '__LAO__';
  Datamap.prototype.lbnTopo = '__LBN__';
  Datamap.prototype.lbrTopo = '__LBR__';
  Datamap.prototype.lbyTopo = '__LBY__';
  Datamap.prototype.lcaTopo = '__LCA__';
  Datamap.prototype.lieTopo = '__LIE__';
  Datamap.prototype.lkaTopo = '__LKA__';
  Datamap.prototype.lsoTopo = '__LSO__';
  Datamap.prototype.ltuTopo = '__LTU__';
  Datamap.prototype.luxTopo = '__LUX__';
  Datamap.prototype.lvaTopo = '__LVA__';
  Datamap.prototype.macTopo = '__MAC__';
  Datamap.prototype.mafTopo = '__MAF__';
  Datamap.prototype.marTopo = '__MAR__';
  Datamap.prototype.mcoTopo = '__MCO__';
  Datamap.prototype.mdaTopo = '__MDA__';
  Datamap.prototype.mdgTopo = '__MDG__';
  Datamap.prototype.mdvTopo = '__MDV__';
  Datamap.prototype.mexTopo = '__MEX__';
  Datamap.prototype.mhlTopo = '__MHL__';
  Datamap.prototype.mkdTopo = '__MKD__';
  Datamap.prototype.mliTopo = '__MLI__';
  Datamap.prototype.mltTopo = '__MLT__';
  Datamap.prototype.mmrTopo = '__MMR__';
  Datamap.prototype.mneTopo = '__MNE__';
  Datamap.prototype.mngTopo = '__MNG__';
  Datamap.prototype.mnpTopo = '__MNP__';
  Datamap.prototype.mozTopo = '__MOZ__';
  Datamap.prototype.mrtTopo = '__MRT__';
  Datamap.prototype.msrTopo = '__MSR__';
  Datamap.prototype.musTopo = '__MUS__';
  Datamap.prototype.mwiTopo = '__MWI__';
  Datamap.prototype.mysTopo = '__MYS__';
  Datamap.prototype.namTopo = '__NAM__';
  Datamap.prototype.nclTopo = '__NCL__';
  Datamap.prototype.nerTopo = '__NER__';
  Datamap.prototype.nfkTopo = '__NFK__';
  Datamap.prototype.ngaTopo = '__NGA__';
  Datamap.prototype.nicTopo = '__NIC__';
  Datamap.prototype.niuTopo = '__NIU__';
  Datamap.prototype.nldTopo = '__NLD__';
  Datamap.prototype.nplTopo = '__NPL__';
  Datamap.prototype.nruTopo = '__NRU__';
  Datamap.prototype.nulTopo = '__NUL__';
  Datamap.prototype.nzlTopo = '__NZL__';
  Datamap.prototype.omnTopo = '__OMN__';
  Datamap.prototype.pakTopo = '__PAK__';
  Datamap.prototype.panTopo = '__PAN__';
  Datamap.prototype.pcnTopo = '__PCN__';
  Datamap.prototype.perTopo = '__PER__';
  Datamap.prototype.pgaTopo = '__PGA__';
  Datamap.prototype.phlTopo = '__PHL__';
  Datamap.prototype.plwTopo = '__PLW__';
  Datamap.prototype.pngTopo = '__PNG__';
  Datamap.prototype.polTopo = '__POL__';
  Datamap.prototype.priTopo = '__PRI__';
  Datamap.prototype.prkTopo = '__PRK__';
  Datamap.prototype.prtTopo = '__PRT__';
  Datamap.prototype.pryTopo = '__PRY__';
  Datamap.prototype.pyfTopo = '__PYF__';
  Datamap.prototype.qatTopo = '__QAT__';
  Datamap.prototype.rouTopo = '__ROU__';
  Datamap.prototype.rusTopo = '__RUS__';
  Datamap.prototype.rwaTopo = '__RWA__';
  Datamap.prototype.sahTopo = '__SAH__';
  Datamap.prototype.sauTopo = '__SAU__';
  Datamap.prototype.scrTopo = '__SCR__';
  Datamap.prototype.sdnTopo = '__SDN__';
  Datamap.prototype.sdsTopo = '__SDS__';
  Datamap.prototype.senTopo = '__SEN__';
  Datamap.prototype.serTopo = '__SER__';
  Datamap.prototype.sgpTopo = '__SGP__';
  Datamap.prototype.sgsTopo = '__SGS__';
  Datamap.prototype.shnTopo = '__SHN__';
  Datamap.prototype.slbTopo = '__SLB__';
  Datamap.prototype.sleTopo = '__SLE__';
  Datamap.prototype.slvTopo = '__SLV__';
  Datamap.prototype.smrTopo = '__SMR__';
  Datamap.prototype.solTopo = '__SOL__';
  Datamap.prototype.somTopo = '__SOM__';
  Datamap.prototype.spmTopo = '__SPM__';
  Datamap.prototype.srbTopo = '__SRB__';
  Datamap.prototype.stpTopo = '__STP__';
  Datamap.prototype.surTopo = '__SUR__';
  Datamap.prototype.svkTopo = '__SVK__';
  Datamap.prototype.svnTopo = '__SVN__';
  Datamap.prototype.sweTopo = '__SWE__';
  Datamap.prototype.swzTopo = '__SWZ__';
  Datamap.prototype.sxmTopo = '__SXM__';
  Datamap.prototype.sycTopo = '__SYC__';
  Datamap.prototype.syrTopo = '__SYR__';
  Datamap.prototype.tcaTopo = '__TCA__';
  Datamap.prototype.tcdTopo = '__TCD__';
  Datamap.prototype.tgoTopo = '__TGO__';
  Datamap.prototype.thaTopo = '__THA__';
  Datamap.prototype.tjkTopo = '__TJK__';
  Datamap.prototype.tkmTopo = {"type":"Topology","objects":{"tkm":{"type":"GeometryCollection","geometries":[{"type":"MultiPolygon","properties":{"name":"Balkan"},"id":"TM.BA","arcs":[[[0]],[[1]],[[2,3,4]]]},{"type":"Polygon","properties":{"name":"Ahal"},"id":"TM.AL","arcs":[[5,6,7,-4,8]]},{"type":"Polygon","properties":{"name":"Tashauz"},"id":"TM.DA","arcs":[[9,-9,-3,10]]},{"type":"Polygon","properties":{"name":"Chardzhou"},"id":"TM.LE","arcs":[[11,-6,-10,12]]},{"type":"Polygon","properties":{"name":"Mary"},"id":"TM.MA","arcs":[[13,-7,-12]]}]}},"arcs":[[[468,4724],[-6,0],[-1,31],[-21,112],[-11,35],[-5,20],[-1,13],[1,35],[-2,35],[-6,60],[-2,31],[3,28],[7,26],[12,17],[17,5],[4,-9],[1,-4],[0,-6],[-21,-21],[-3,-53],[9,-104],[9,-109],[16,-107],[-3,-17],[0,-7],[3,-11]],[[750,5810],[4,-1],[3,8],[3,-29],[1,-7],[15,-32],[-4,-15],[-9,-15],[-11,-10],[-10,0],[-4,10],[-8,41],[-5,17],[-3,17],[3,15],[9,11],[8,6],[4,-10],[4,-6]],[[2883,8049],[0,-1],[2,-52],[4,-25],[18,-71],[19,-88],[6,-18],[4,-10],[7,-9],[7,-5],[6,-2],[9,0],[3,-3],[3,-7],[1,-11],[-1,-9],[-4,-16],[-2,-7],[1,-9],[2,-9],[7,-11],[5,-5],[15,-10],[5,-5],[9,-14],[21,-47],[22,-33],[3,-5],[81,-295],[9,-45],[3,-9],[5,-13],[17,-30],[21,-26],[40,-74],[10,-39],[29,-169],[32,-118],[-6,-42],[-30,-126],[21,-22],[20,-17],[5,-9],[3,-8],[12,-53]],[[3327,6472],[-84,-63],[-38,-40],[-4,-10],[-2,-9],[0,-12],[2,-10],[2,-10],[9,-23],[2,-10],[9,-78],[59,-323],[1,-14],[-3,-10],[-6,-8],[-8,-9],[-45,-24],[-17,-14],[-4,-6],[-5,-14],[-215,-1011],[-3,-31],[-1,-19],[-2,-11],[-3,-9],[-20,-49],[-3,-13],[-1,-10],[3,-28],[-1,-13],[-2,-7],[-5,-6],[-12,-7],[-5,-5],[-5,-9],[-3,-10],[-1,-11],[-7,-121],[1,-20],[2,-9],[5,-9],[3,-4],[4,-4],[4,0],[4,0],[8,-1],[11,-5],[40,-28],[11,-5],[8,-1],[36,16],[14,2],[10,-3],[9,-5],[9,-7],[7,-1],[7,3],[20,11],[11,3],[5,-3],[5,-8],[8,-43],[3,-11],[15,-33],[11,-16],[68,-67],[60,-87]],[[3308,4080],[-2,-3],[-15,-37],[-8,-13],[-23,-22],[-9,-13],[-13,-10],[-15,3],[-27,17],[-106,29],[-11,5],[-24,21],[-28,32],[-7,2],[-33,-8],[-57,-36],[-11,-3],[-10,6],[-8,10],[-10,9],[-12,5],[-65,-4],[-25,-14],[-24,-24],[-45,-60],[-4,-18],[19,-32],[4,-23],[-3,-24],[-7,-21],[-11,-12],[-60,-15],[-12,2],[-22,14],[-3,2],[-29,5],[-100,-27],[-11,1],[-10,5],[-19,15],[-12,5],[-36,0],[-10,6],[-28,23],[-43,14],[-21,0],[-139,-43],[-45,-3],[-17,-10],[-52,-59],[-15,-11],[-14,-17],[-8,-2],[-32,-16],[-16,-12],[-6,-21],[-9,-5],[-40,-11],[-14,-7],[-6,-10],[-8,-24],[-5,-10],[-7,-4],[-10,-3],[-9,-7],[-4,-17],[-5,-14],[-33,-54],[-106,-107],[-21,-34],[-9,-22],[-4,-20],[-3,-26],[-11,-41],[0,-27],[3,-8],[8,-11],[3,-8],[1,-9],[-1,-32],[-2,-18],[-10,-33],[-2,-20],[-3,-10],[-18,-22],[-33,-32],[-9,-12],[-14,-9],[-17,-27],[-11,-8],[-15,0],[-43,14],[-16,-4],[-119,-102],[-25,-12],[-16,0],[-16,3],[-15,-1],[-13,-13],[-13,-19],[-13,-8],[-14,-1],[-192,25],[-10,164],[-7,52],[-13,52],[-4,26],[-4,57],[-25,175],[-12,375],[2,21],[10,44],[7,63],[17,100],[-3,36],[9,41],[1,56],[-4,96],[-1,10],[-6,18],[-3,12],[-2,13],[-2,27],[-10,79],[-1,29],[6,105],[8,53],[11,43],[33,76],[12,47],[-7,39],[11,13],[5,23],[4,27],[7,21],[7,19],[9,26],[3,18],[-7,-3],[-1,27],[-9,14],[-25,12],[0,3],[-3,11],[-1,3],[-3,3],[-9,5],[-2,1],[-4,9],[-3,10],[-2,13],[-1,14],[-8,25],[-8,9],[-28,1],[-17,7],[-6,2],[-8,-5],[-3,-8],[-3,-2],[-8,11],[-6,19],[-14,62],[-4,13],[-7,-10],[2,-20],[6,-22],[6,-12],[0,-8],[-11,9],[-11,20],[-4,24],[7,35],[-6,24],[1,13],[4,8],[20,19],[-21,3],[0,28],[16,59],[-15,-12],[-19,-21],[-12,-21],[10,-9],[7,-144],[-8,20],[-18,33],[-8,19],[-3,24],[-1,26],[-5,20],[-15,2],[4,16],[2,21],[-1,18],[-7,8],[-4,-9],[-11,-41],[-7,-13],[-2,30],[3,39],[14,74],[-20,-27],[12,45],[3,18],[-5,-3],[-14,-6],[7,28],[-2,11],[-8,-7],[-12,-23],[-5,10],[-8,-7],[-30,-3],[-14,-16],[-6,1],[0,25],[-5,0],[-5,-13],[-8,-13],[-9,-9],[-11,-1],[3,8],[6,28],[-4,0],[-10,-1],[-5,1],[-1,-2],[-6,-7],[-3,-1],[-2,3],[-5,12],[-2,3],[-10,-5],[-18,-13],[-11,0],[0,10],[5,9],[-2,5],[-6,2],[-9,1],[-8,2],[-11,12],[-7,4],[-14,-1],[-34,-15],[-15,-11],[26,-23],[8,-4],[-13,-29],[-4,-17],[-2,-21],[1,-22],[8,-55],[-2,-31],[-6,-16],[-8,3],[-17,185],[-4,16],[-30,65],[-2,22],[6,26],[7,12],[20,28],[3,12],[3,17],[3,15],[14,16],[9,25],[26,102],[19,56],[24,37],[27,-8],[-15,-12],[-11,-14],[-20,-40],[-3,-11],[-7,-38],[-2,-4],[-15,-23],[4,-33],[27,-5],[77,22],[44,-2],[14,-7],[9,-17],[6,-20],[7,-18],[10,-11],[12,-5],[29,-3],[12,-9],[7,1],[3,13],[-1,13],[-2,9],[-4,6],[-8,3],[10,33],[8,-4],[10,-21],[11,-17],[13,0],[21,29],[14,7],[6,-4],[17,-13],[6,-1],[8,12],[-2,13],[-8,12],[-7,8],[-16,9],[-30,11],[-12,16],[11,5],[6,10],[1,14],[-6,20],[-10,13],[-9,3],[-34,-5],[-2,8],[-1,26],[-2,13],[-6,16],[-7,13],[-9,7],[5,-44],[0,-19],[-5,0],[-25,58],[-19,26],[-19,6],[3,-7],[7,-29],[-4,4],[-12,9],[-4,5],[1,-25],[13,-25],[1,-22],[-24,24],[-3,46],[12,101],[-8,-7],[-9,-2],[-8,2],[-8,7],[0,8],[23,17],[37,74],[22,35],[-4,7],[-4,14],[-2,5],[6,5],[7,3],[14,2],[10,4],[0,10],[-5,9],[-3,3],[8,16],[11,15],[10,17],[5,24],[-4,-3],[-2,-1],[-1,-1],[-3,-4],[-12,17],[-10,4],[-26,-3],[-12,6],[-16,21],[-11,10],[-12,5],[-12,0],[-12,-5],[-12,-10],[-29,-48],[-12,-7],[-3,-2],[-11,-13],[-5,-2],[-6,2],[-12,13],[-6,2],[-8,6],[-46,52],[-12,-7],[-10,-15],[-11,-8],[-51,-9],[4,12],[5,9],[5,8],[6,7],[-48,-23],[-27,-5],[-22,10],[-11,39],[-10,13],[-12,-16],[-1,-14],[6,-18],[11,-26],[3,-16],[5,-74],[4,-11],[20,-38],[7,-9],[27,-71],[22,-30],[6,-7],[0,-8],[-33,26],[9,-10],[20,-35],[-5,-8],[-23,32],[-9,18],[-20,69],[-10,17],[-25,16],[-8,21],[-5,27],[-4,51],[-6,14],[-68,78],[-24,36],[-10,28],[5,57],[5,31],[6,20],[5,23],[-8,24],[-19,37],[9,12],[-3,13],[-15,21],[-13,50],[2,50],[24,225],[10,44],[16,43],[42,83],[21,57],[4,47],[-6,8],[-19,6],[-4,9],[2,12],[5,24],[0,4],[-3,4],[9,8],[11,7],[5,-1],[2,12],[-2,14],[-2,12],[-2,7],[16,98],[27,99],[5,45],[-10,91],[0,52],[8,-8],[17,-13],[6,-10],[3,-15],[-1,-16],[-3,-14],[-1,-14],[8,-25],[30,-55],[6,-22],[8,-50],[6,-18],[22,-22],[2,-5],[18,0],[8,2],[8,7],[-11,-18],[-18,-9],[-12,-10],[5,-21],[5,-7],[11,-13],[6,-11],[1,-12],[0,-15],[2,-13],[8,-5],[32,-3],[13,1],[16,10],[32,48],[11,6],[-12,-35],[-3,-20],[8,-8],[53,9],[6,7],[1,14],[0,17],[2,12],[11,21],[7,7],[9,-6],[0,-7],[-5,-24],[0,-12],[6,-26],[10,-20],[14,-14],[16,-4],[4,-3],[10,-13],[8,-2],[8,2],[6,5],[10,11],[25,16],[10,16],[3,27],[-1,56],[3,21],[17,50],[4,3],[9,0],[6,-3],[7,-6],[6,-7],[2,-7],[2,-5],[10,-6],[3,-3],[0,-8],[-2,-8],[-2,-7],[-1,-4],[4,-27],[3,-10],[8,-7],[-6,-19],[-4,-9],[-5,-8],[8,-23],[11,-52],[10,-24],[7,-6],[7,-2],[6,-4],[4,-14],[-2,-9],[-10,-29],[-2,-11],[11,-32],[27,0],[32,9],[41,-9],[11,16],[11,20],[31,24],[7,2],[7,-2],[19,-15],[18,-3],[14,6],[13,10],[22,8],[6,8],[3,10],[2,10],[-4,1],[-19,13],[-6,9],[40,-3],[21,5],[21,17],[43,-2],[2,-3],[-3,-9],[-7,-31],[-2,-7],[3,-4],[21,-14],[107,-4],[-14,12],[-15,7],[9,17],[27,10],[11,17],[-70,-2],[-9,2],[-5,12],[-2,28],[-3,23],[-13,36],[-4,34],[-7,22],[-2,11],[1,9],[3,6],[2,6],[-1,10],[-5,3],[-7,-2],[-6,3],[-1,14],[2,6],[6,1],[6,0],[5,3],[18,29],[9,11],[14,3],[20,-12],[43,-49],[12,0],[19,-18],[2,-19],[-8,-21],[-13,-24],[26,-9],[81,22],[24,12],[11,3],[12,31],[30,22],[6,8],[27,62],[7,21],[2,21],[-2,22],[-7,18],[-17,32],[-23,51],[-8,7],[0,9],[15,-4],[17,-12],[31,-29],[-5,11],[-14,17],[-6,8],[-6,14],[-3,7],[-1,6],[1,9],[3,8],[4,4],[2,-4],[-12,23],[-19,7],[-20,5],[-17,11],[-1,39],[-24,38],[-141,153],[-62,38],[-12,12],[-26,37],[-33,26],[-14,15],[-4,7],[-7,22],[-16,33],[-6,7],[-25,7],[-14,13],[-10,17],[-10,19],[-13,42],[-8,45],[-3,52],[-1,113],[-4,47],[-7,44],[-12,42],[-33,80],[-6,23],[-3,11],[-8,4],[-8,2],[-5,5],[-3,16],[2,12],[4,12],[2,14],[0,8],[-4,26],[-1,16],[9,30],[1,15],[0,22],[-3,26],[-4,25],[-7,21],[-22,30],[-33,30],[-36,15],[-30,-13],[-30,23],[-216,-50],[-41,-31],[-14,-4],[-55,3],[-39,29],[-29,-17],[-27,-34],[-17,-26],[-70,-78],[-17,-38],[-81,-249],[-12,-27],[-10,-11],[-6,-14],[-5,-31],[-4,-34],[3,-20],[8,4],[22,40],[11,10],[35,-5],[16,-11],[9,-20],[-1,-17],[-11,-27],[-2,-14],[0,-13],[4,-26],[0,-15],[-2,-29],[-47,-168],[-4,-27],[-8,-37],[-2,-12],[2,-13],[8,-33],[7,-54],[5,-82],[5,-22],[37,-109],[4,-23],[-4,-27],[-15,-38],[0,-29],[-5,0],[-4,12],[-11,14],[-4,10],[-1,14],[5,40],[0,30],[-2,27],[-5,26],[-7,24],[-3,7],[-9,15],[-3,5],[-1,15],[2,25],[-1,13],[-15,77],[-1,13],[-9,11],[-11,49],[-12,12],[-9,2],[-6,8],[-3,13],[-1,17],[-1,12],[-4,8],[-12,16],[-8,8],[-18,4],[-7,6],[-25,45],[-12,13],[-13,8],[-9,14],[-2,32],[3,3],[14,37],[3,11],[0,15],[0,28],[1,9],[4,14],[0,8],[-2,8],[-3,5],[-4,3],[-1,2],[-6,27],[-4,10],[-5,8],[-5,2],[-11,-2],[-5,4],[-7,15],[-4,6],[-11,7],[-11,18],[-6,4],[-17,7],[-9,19],[29,41],[107,149],[94,129],[0,1],[151,173],[110,54],[40,33],[155,85],[46,14],[124,31],[108,27],[169,42],[53,-10],[51,-25],[109,-101],[119,-110],[71,-65],[83,-77],[119,-152],[17,-30],[7,-25],[-1,-22],[-2,-23],[-2,-28],[4,-27],[8,-23],[73,-138],[32,-60],[45,-113],[45,-111],[22,-37],[24,-30],[44,-43],[11,-17],[9,-22],[20,-67],[12,-22],[14,-16],[20,-15],[22,-11],[88,7],[42,23],[65,13],[63,43],[24,3],[48,-7],[114,-8],[131,-10],[146,-11]],[[5686,5683],[30,-4],[325,37]],[[6041,5716],[-4,-205],[-8,-21],[-7,-26],[-45,-15],[-90,-40],[-23,-42],[-44,-357],[-5,-21],[-7,-24],[-12,-9],[-44,-10],[-12,-7],[-6,-17],[-4,-20],[-14,-134],[-4,-22],[-6,-21],[-11,-7],[-12,-1],[-38,5],[87,-531],[14,-59],[177,-269],[28,-60],[57,-167],[5,-29],[-7,-12],[-12,-7],[-29,-6],[-12,-4],[-5,-8],[2,-18],[34,-146],[6,-38],[-7,-15],[-12,-8],[-15,-1],[-7,-38],[1,-68],[51,-297],[3,-3],[4,-3],[10,-4],[8,0],[13,1],[16,-2],[14,4],[63,-6],[10,-3],[5,-2],[4,-4],[3,-5],[7,-13],[36,-95],[2,-2],[3,2],[7,7],[10,7],[21,12],[4,2],[21,1],[31,-11],[11,-8],[4,-4],[3,-6],[4,-8],[2,-7],[1,-7],[2,-15],[-1,-16],[0,-8],[-3,-15],[-5,-20],[-7,-18],[-9,-18],[-4,-6],[-18,-17],[-17,-8],[-10,-2],[-10,-1],[-11,2],[-10,4],[-5,2],[-7,7],[-7,8],[-7,14],[-4,9],[0,65],[-5,29],[-8,30],[-16,45],[-10,21],[-14,20],[-5,4],[-5,4],[-31,8],[-10,0],[-15,-5],[-32,-2],[-5,-1],[-5,-4],[2,-8],[130,-316],[26,-61],[163,-406],[34,-118],[2,-382],[2,-391],[5,-67],[8,-6],[8,-8],[31,-3],[5,-9],[3,-64],[-2,-7],[-3,-3],[-3,-3],[-6,-9],[-3,-3],[-4,-2],[-6,-7],[-3,-4],[-4,-4],[-3,-2],[-10,-4],[-22,1],[-13,-4],[-5,-5],[-4,-7],[-6,-16],[0,-9],[0,-8],[12,-35],[4,-10],[11,-19],[9,-14],[28,-46],[11,-11],[4,-4],[3,-6],[-1,-6],[-2,-4],[-15,-22],[-5,-10],[-2,-6],[-1,-8],[-6,-97],[-2,-18],[-2,-12],[-22,-38],[-6,-8],[-25,-24],[-6,-9],[-8,-17],[-7,-11]],[[6321,530],[-5,3],[-8,2],[-6,5],[-4,7],[-5,11],[0,5],[3,14],[0,6],[-11,15],[-2,0],[-1,0],[-9,12],[6,14],[1,4],[-7,9],[-5,4],[-6,0],[-37,-11],[-9,-5],[-18,40],[-9,29],[-2,35],[3,8],[9,14],[3,9],[-1,24],[1,7],[4,31],[0,13],[-4,9],[4,30],[0,21],[-3,20],[-3,46],[-5,23],[-6,22],[-7,19],[-11,20],[-13,17],[-14,12],[-17,4],[-10,7],[8,15],[15,18],[8,14],[1,12],[-3,26],[2,16],[5,6],[6,4],[6,7],[3,14],[0,12],[1,13],[3,11],[3,9],[8,15],[1,8],[-1,6],[-2,40],[-11,81],[-10,26],[-2,12],[0,31],[-2,13],[-3,14],[-2,8],[-5,8],[-5,6],[-7,5],[2,9],[1,3],[2,6],[-10,37],[4,64],[15,105],[-4,20],[-1,16],[3,14],[4,10],[4,12],[3,15],[1,16],[-1,16],[-3,12],[-6,20],[-6,45],[-28,6],[-35,9],[-72,-2],[-84,-2],[-150,-4],[-98,-3],[-112,-3],[-23,19],[-15,38],[-20,80],[-15,36],[-75,136],[-32,74],[-27,83],[-20,42],[-27,17],[-58,15],[-26,23],[-46,58],[-101,49],[-8,0],[-6,-5],[-8,-19],[-5,-8],[-7,-2],[-9,11],[-5,22],[-4,24],[-5,21],[-11,19],[-11,2],[-22,-13],[-6,1],[-6,4],[-6,7],[-4,7],[-12,4],[-2,10],[2,11],[1,8],[1,4],[3,4],[1,7],[-5,9],[-13,21],[-44,55],[-8,18],[-14,90],[-2,27],[3,15],[4,12],[3,12],[-2,11],[-4,14],[2,29],[-3,18],[-14,27],[-14,20],[-16,7],[-40,-27],[-15,2],[-94,100],[-23,35],[-7,6],[-21,5],[-9,4],[-10,11],[-28,19],[-55,18],[-42,35],[-4,-9],[-1,-19],[-10,-18],[-7,-3],[-7,-1],[-15,4],[-8,0],[-5,-6],[-5,-8],[-6,-5],[-16,-3],[-16,4],[-30,18],[-35,46],[-12,9],[-14,-2],[-11,-11],[-8,-19],[-6,-21],[-10,-22],[-12,-9],[-64,-9],[-10,4],[-18,19],[-9,7],[-55,12],[-12,6],[-12,15],[-3,15],[0,18],[-2,24],[-3,10],[-11,30],[0,10],[1,10],[0,9],[-5,9],[-12,8],[-12,4],[-23,3],[-47,16],[-110,78],[-24,10],[-12,-2],[-12,-4],[-11,-1],[-11,7],[-4,8],[-6,19],[-5,8],[-6,2],[-12,-4],[-2,0],[-4,1],[-9,8],[-8,11],[-10,9],[-10,0],[-11,-4],[-34,-1],[-36,15],[-12,3],[-12,-3],[-11,-5],[-11,-2],[-101,59],[-18,34],[14,69],[2,22],[-4,23],[-15,31],[-8,40],[-23,36],[-8,18],[-13,46],[-16,40],[-3,11],[-1,10],[-2,9],[-7,7],[-15,7],[-8,2],[-8,-2],[-12,-8],[-6,-10]],[[3327,6472],[4,-16],[3,-6],[3,-4],[4,-3],[26,-9],[5,-3],[3,-4],[6,-9],[5,-9],[2,-5],[4,-4],[4,-4],[5,-2],[7,-1],[44,8],[5,2],[5,5],[26,39],[16,13],[44,25],[285,-7],[83,16],[172,71],[76,-11],[13,3],[3,6],[2,7],[-3,33],[1,7],[1,7],[2,6],[3,4],[3,3],[6,1],[56,-1],[47,-17],[31,-19],[280,-99],[35,-68],[10,-12],[42,-42],[52,-17],[177,-4],[384,0],[9,-2],[4,-6],[1,-15],[0,-419],[2,-17],[5,-12],[41,-68],[4,-4],[6,-2],[14,5],[9,5],[7,6],[4,4],[3,5],[8,16],[3,5],[4,4],[7,1],[9,-1],[20,-7],[9,-1],[7,1],[15,13],[4,2],[5,-1],[6,-4],[8,-14],[4,-8],[3,-8],[2,-12],[4,-46],[6,-31],[2,-6],[2,-6],[4,-6],[7,-9],[7,-11],[2,-5],[2,-14],[3,-12],[2,-5],[22,-4],[91,20]],[[6029,7958],[0,-25],[-3,-226],[-4,-20],[-10,-26],[-510,-1],[-6,-1],[4,-846],[1,-15],[4,-8],[9,-4],[140,-6],[9,-5],[4,-13],[1,-17],[4,-394],[5,-419],[3,-240],[6,-9]],[[2883,8049],[25,-2],[157,-12],[67,-20],[86,-25],[14,11],[21,56],[14,22],[33,23],[15,15],[8,13],[1,9],[-5,6],[-35,12],[-11,7],[-10,10],[-15,25],[-14,32],[-9,36],[-4,36],[1,46],[-3,38],[-8,34],[-15,36],[-13,47],[1,41],[5,42],[2,49],[-16,103],[1,51],[20,38],[67,44],[29,30],[26,54],[0,1],[39,100],[57,77],[66,45],[67,4],[100,-24],[33,9],[39,26],[13,5],[48,-4],[14,5],[15,15],[-2,13],[-9,14],[-5,20],[6,17],[27,12],[10,16],[28,90],[7,31],[-2,20],[-15,45],[-4,35],[12,13],[19,12],[18,29],[6,15],[8,13],[13,8],[15,4],[16,-1],[14,-6],[10,-14],[16,-33],[11,-9],[12,2],[25,15],[13,3],[15,-4],[70,-46],[24,-24],[18,-33],[7,-47],[-2,-24],[-4,-22],[0,-20],[8,-18],[12,-4],[45,10],[9,7],[2,11],[-3,11],[-8,10],[-28,46],[-53,117],[-18,61],[-22,46],[-25,27],[-88,56],[-13,17],[-4,25],[6,19],[13,13],[27,16],[37,31],[13,6],[17,-1],[76,-42],[36,-11],[37,-3],[29,11],[15,38],[9,111],[13,30],[17,-14],[152,-244],[47,-60],[49,-31],[32,-7],[20,1],[21,8],[20,13],[18,3],[17,-15],[45,-64],[10,-22],[6,-25],[9,-100],[9,-23],[20,-15],[36,-5],[17,-8],[28,-42],[17,-9],[37,-2],[149,32],[61,-8],[31,5],[32,-4],[22,-34],[20,-42],[24,-31],[32,-17],[16,-13],[8,-17],[-2,-22],[-12,-12],[-14,-8],[-11,-12],[-7,-60],[14,-65],[2,-51],[-42,-23],[-13,-5],[-8,-12],[-1,-18],[8,-18],[10,-6],[37,1],[73,-38],[21,-25],[16,-34],[8,-17],[11,-16],[33,-27],[10,-12],[9,-15],[7,-18],[1,-19],[-8,-16],[-11,-3],[-14,9],[-24,21],[-27,12],[-22,-3],[-19,-18],[-18,-36],[6,-46],[22,-58],[47,-92],[6,-24],[-10,-17],[-29,-20],[-12,-15],[-9,-18],[-6,-23],[-8,-105],[5,-31],[19,-27],[77,-55],[68,-49],[43,-44],[38,-54],[20,-20],[24,-10],[43,2],[85,40],[141,12],[50,-17],[33,-49],[5,6],[5,7],[9,22]],[[8650,2235],[-1,0],[-164,-1],[-143,1],[-196,1],[-167,0],[-168,-1],[-20,7],[-5,35],[-9,603],[28,35],[12,20],[28,63],[95,183],[-8,57],[-95,172],[-243,406],[-47,41],[-161,93],[-73,39],[-63,81],[-225,352],[-577,882],[-134,200],[-108,159],[-24,35],[-141,18]],[[6029,7958],[4,10],[3,-3],[2,-12],[4,-12],[41,10],[13,0],[72,-72],[29,-17],[27,2],[24,17],[20,30],[13,41],[17,14],[7,46],[10,28],[16,10],[26,-4],[68,-25],[61,-37],[158,-163],[13,-21],[52,-122],[6,-22],[2,-26],[2,-92],[4,-20],[-6,-9],[8,-26],[22,-110],[8,-60],[6,-28],[8,-17],[23,-36],[8,-18],[14,-80],[10,-28],[26,-49],[4,-12],[6,-30],[1,-3],[4,-9],[15,-16],[33,-14],[58,-48],[7,-11],[2,-56],[5,-24],[18,-51],[6,-24],[2,-26],[1,-35],[3,-26],[21,-67],[3,-28],[-4,-24],[-6,-23],[-3,-29],[2,-30],[13,-73],[7,-35],[51,-91],[7,-6],[41,-58],[82,-85],[96,-98],[115,-117],[232,-237],[97,-100],[45,-62],[76,-152],[42,-63],[78,-81],[99,-102],[113,-117],[21,-16],[21,-6],[18,6],[54,40],[22,3],[16,-15],[22,-40],[40,-75],[148,-181],[90,-76],[104,-53],[47,-44],[94,-124],[66,-88],[95,-94],[70,-69],[116,-115],[47,-23],[49,6],[18,15],[34,40],[20,12],[24,-3],[71,-50],[46,-11],[20,-16],[44,-51],[45,-19],[23,-15],[21,-29],[33,-61],[71,-49],[22,-10],[54,0],[27,-11],[25,-18],[24,-25],[8,-36],[7,-27],[-26,-74],[-39,-74],[-24,-65],[-3,-51],[6,-103],[-3,-52],[-16,-88],[-2,-46],[9,-37],[14,-18],[11,-18],[3,-21],[-11,-27],[-13,-20],[-11,-22],[-1,-24],[17,-20],[-12,-11],[-12,-16],[-11,-18],[-6,-7],[-7,-2],[-9,7],[-10,23],[-7,5],[-17,-3],[-49,-24],[-18,3],[-14,16],[-12,17],[-5,4],[-6,5],[-7,3],[-10,12],[-7,3],[-24,-2],[-8,2],[-14,10],[-12,18],[-20,39],[-12,16],[-158,88],[-14,15],[-5,8],[-5,13],[-12,39],[-6,5],[-14,5],[-10,7],[-2,-19],[-5,-34],[-9,-11],[-29,0],[-12,-4],[-9,-8],[-7,-13],[-7,-21],[-9,-26],[-7,-28],[-3,-29],[5,-56],[1,-29],[-4,-27],[-9,-18],[-20,-30],[-32,-67],[-25,-19],[-10,-1],[-299,-11],[-52,-26],[-127,-102],[-21,-23],[-13,-33],[-3,-51],[13,-99],[3,-51],[-9,-45],[-26,-70]],[[8650,2235],[-76,-207],[-11,-42],[-9,-51],[-3,-27],[1,-26],[3,-27],[10,-50],[2,-27],[-4,-52],[-8,-48],[-12,-46],[-55,-128],[-15,-26],[-23,-28],[-24,-13],[-52,-19],[-13,-8],[-10,-10],[-9,-16],[-11,-53],[-7,-9],[-8,4],[-12,7],[-29,7],[-26,-7],[-25,-19],[-47,-53],[-9,-17],[-5,-21],[0,-23],[6,-62],[0,-17],[-67,40],[-20,6],[-11,-2],[-12,-3],[-21,-10],[-66,-59],[-28,-11],[-87,-8],[-14,-4],[-13,-11],[-10,-16],[-17,-34],[-10,-14],[-57,-40],[-61,-20],[-154,5],[-14,-4],[-11,-18],[-3,-22],[5,-17],[7,-17],[3,-23],[4,-17],[36,-49],[10,-20],[5,-6],[18,-10],[3,-7],[0,-9],[-5,-12],[-19,-22],[-54,-26],[-19,-28],[-1,-20],[2,-67],[2,-16],[12,-14],[2,-14],[-7,-41],[-3,-49],[-4,-25],[-10,-15],[-14,-5],[-29,-4],[-14,-5],[-47,-34],[-64,-77],[-3,-3],[-44,-33],[-19,-28],[-9,-19],[-9,-13],[-10,-10],[-51,-34],[-12,-4],[-6,1],[-21,14],[-8,-1],[-7,-3],[-7,-1],[-7,7],[-47,65],[-19,-2],[-22,-32],[-69,-142],[-11,-9],[-7,14],[-14,47],[-4,20],[1,53],[-1,22],[-5,24],[-7,20],[-10,16],[-39,26],[-20,20],[-72,108],[-18,20],[-21,16],[-41,1],[-85,-45],[-42,-5],[-95,22],[-46,28],[-32,55],[-46,64],[-6,4]]],"transform":{"scale":[0.0014209532033859142,0.0007651305902590257],"translate":[52.43767061734431,35.14064687100006]}};
  Datamap.prototype.tlsTopo = '__TLS__';
  Datamap.prototype.tonTopo = '__TON__';
  Datamap.prototype.ttoTopo = '__TTO__';
  Datamap.prototype.tunTopo = '__TUN__';
  Datamap.prototype.turTopo = '__TUR__';
  Datamap.prototype.tuvTopo = '__TUV__';
  Datamap.prototype.twnTopo = '__TWN__';
  Datamap.prototype.tzaTopo = '__TZA__';
  Datamap.prototype.ugaTopo = '__UGA__';
  Datamap.prototype.ukrTopo = '__UKR__';
  Datamap.prototype.umiTopo = '__UMI__';
  Datamap.prototype.uryTopo = '__URY__';
  Datamap.prototype.usaTopo = '__USA__';
  Datamap.prototype.usgTopo = '__USG__';
  Datamap.prototype.uzbTopo = '__UZB__';
  Datamap.prototype.vatTopo = '__VAT__';
  Datamap.prototype.vctTopo = '__VCT__';
  Datamap.prototype.venTopo = '__VEN__';
  Datamap.prototype.vgbTopo = '__VGB__';
  Datamap.prototype.virTopo = '__VIR__';
  Datamap.prototype.vnmTopo = '__VNM__';
  Datamap.prototype.vutTopo = '__VUT__';
  Datamap.prototype.wlfTopo = '__WLF__';
  Datamap.prototype.wsbTopo = '__WSB__';
  Datamap.prototype.wsmTopo = '__WSM__';
  Datamap.prototype.yemTopo = '__YEM__';
  Datamap.prototype.zafTopo = '__ZAF__';
  Datamap.prototype.zmbTopo = '__ZMB__';
  Datamap.prototype.zweTopo = '__ZWE__';

  /**************************************
                Utilities
  ***************************************/

  // Convert lat/lng coords to X / Y coords
  Datamap.prototype.latLngToXY = function(lat, lng) {
     return this.projection([lng, lat]);
  };

  // Add <g> layer to root SVG
  Datamap.prototype.addLayer = function( className, id, first ) {
    var layer;
    if ( first ) {
      layer = this.svg.insert('g', ':first-child')
    }
    else {
      layer = this.svg.append('g')
    }
    return layer.attr('id', id || '')
      .attr('class', className || '');
  };

  Datamap.prototype.updateChoropleth = function(data, options) {
    var svg = this.svg;
    var that = this;

    // When options.reset = true, reset all the fill colors to the defaultFill and kill all data-info
    if ( options && options.reset === true ) {
      svg.selectAll('.datamaps-subunit')
        .attr('data-info', function() {
           return "{}"
        })
        .transition().style('fill', this.options.fills.defaultFill)
    }

    for ( var subunit in data ) {
      if ( data.hasOwnProperty(subunit) ) {
        var color;
        var subunitData = data[subunit]
        if ( ! subunit ) {
          continue;
        }
        else if ( typeof subunitData === "string" ) {
          color = subunitData;
        }
        else if ( typeof subunitData.color === "string" ) {
          color = subunitData.color;
        }
        else if ( typeof subunitData.fillColor === "string" ) {
          color = subunitData.fillColor;
        }
        else {
          color = this.options.fills[ subunitData.fillKey ];
        }
        // If it's an object, overriding the previous data
        if ( subunitData === Object(subunitData) ) {
          this.options.data[subunit] = defaults(subunitData, this.options.data[subunit] || {});
          var geo = this.svg.select('.' + subunit).attr('data-info', JSON.stringify(this.options.data[subunit]));
        }
        svg
          .selectAll('.' + subunit)
          .transition()
            .style('fill', color);
      }
    }
  };

  Datamap.prototype.updatePopup = function (element, d, options) {
    var self = this;
    element.on('mousemove', null);
    element.on('mousemove', function() {
      var position = d3.mouse(self.options.element);
      d3.select(self.svg[0][0].parentNode).select('.datamaps-hoverover')
        .style('top', ( (position[1] + 30)) + "px")
        .html(function() {
          var data = JSON.parse(element.attr('data-info'));
          try {
            return options.popupTemplate(d, data);
          } catch (e) {
            return "";
          }
        })
        .style('left', ( position[0]) + "px");
    });

    d3.select(self.svg[0][0].parentNode).select('.datamaps-hoverover').style('display', 'block');
  };

  Datamap.prototype.addPlugin = function( name, pluginFn ) {
    var self = this;
    if ( typeof Datamap.prototype[name] === "undefined" ) {
      Datamap.prototype[name] = function(data, options, callback, createNewLayer) {
        var layer;
        if ( typeof createNewLayer === "undefined" ) {
          createNewLayer = false;
        }

        if ( typeof options === 'function' ) {
          callback = options;
          options = undefined;
        }

        options = defaults(options || {}, self.options[name + 'Config']);

        // Add a single layer, reuse the old layer
        if ( !createNewLayer && this.options[name + 'Layer'] ) {
          layer = this.options[name + 'Layer'];
          options = options || this.options[name + 'Options'];
        }
        else {
          layer = this.addLayer(name);
          this.options[name + 'Layer'] = layer;
          this.options[name + 'Options'] = options;
        }
        pluginFn.apply(this, [layer, data, options]);
        if ( callback ) {
          callback(layer);
        }
      };
    }
  };

  // Expose library
  if (typeof exports === 'object') {
    d3 = require('d3');
    topojson = require('topojson');
    module.exports = Datamap;
  }
  else if ( typeof define === "function" && define.amd ) {
    define( "datamaps", ["require", "d3", "topojson"], function(require) {
      d3 = require('d3');
      topojson = require('topojson');

      return Datamap;
    });
  }
  else {
    window.Datamap = window.Datamaps = Datamap;
  }

  if ( window.jQuery ) {
    window.jQuery.fn.datamaps = function(options, callback) {
      options = options || {};
      options.element = this[0];
      var datamap = new Datamap(options);
      if ( typeof callback === "function" ) {
        callback(datamap, options);
      }
      return this;
    };
  }
})();
