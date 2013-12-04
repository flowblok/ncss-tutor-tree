queue()
  .defer(d3.csv, 'NCSS2009.csv')
  .defer(d3.csv, 'NCSS2010.csv')
  .defer(d3.csv, 'NCSS2011.csv')
//  .defer(d3.csv, 'NCSS2012.csv')
//  .defer(d3.csv, 'NCSS2013.csv')
  .await(loadNCSSTree)

// A list of people's names
var names = d3.map();
// A map of the tutors by group and year
var groupTutors = d3.map();
// Relationships list
var relationships = [];

function loadNCSSTree(error, tree2009, tree2010, tree2011, tree2012, tree2013) {
  var trees = [tree2009, tree2010, tree2011];
  
  // Build the groupTutors map
  trees.forEach(function(tree, year) {
    year += 2009;

    // Add a map for each year's groups
    groupTutors.set(year, d3.map());

    tree.forEach(function(person) {
      if (isTutor(person)) {
        // Get the group of tutors this person is in
        var group = groupTutors.get(year).get(person.group);

        // Construct a new group if it doesn't exist yet
        if (group === undefined)
          group = groupTutors.get(year).set(person.group, []);

        // Add the person to the group
        group.push(person);
      }

      // Add the person to the set of people
      names.set(person.name, {name: person.name});
    });
  });

  console.log(groupTutors);

  // Build the tutoredBy and tutoredWith maps
  trees.forEach(function(tree, year) {
    year += 2009;

    tree.forEach(function(person) {
      // Build the tutoredWith map
      if (isTutor(person)) {
        // Get the tutors this person tutored with
        var fellowTutors = groupTutors.get(year).get(person.group);

        // Add relationships
        if (fellowTutors)
          fellowTutors.forEach(function(tutor) {
            relationships.push({
              source: person.name,
              target: tutor.name,
              relationship: 'tutored with',
              year: year,
            });
          });
      }

      // Build the tutoredBy map
      else if (person.role === "student") {
        // Get the tutors who tutored this person
        var tutors = groupTutors.get(year).get(person.group);

        // Add relationships
        if (tutors)
          tutors.forEach(function(tutor) {
            relationships.push({
              source: person.name,
              target: tutor.name,
              relationship: 'tutored by',
              year: year,
            });
          });
      }
    });
  });

  // Create the graph visualization

  // SVG element
  var svg = d3.select('body').append('svg');
  
  // Groups of elements
  var peopleGroup = svg.append('svg:g')
    .attr('class', 'people');

  var relationshipGroup = svg.append('svg:g')
    .attr('class', 'relationships');

  var people, rels;

  updateGraph = function() {
    // Each person has an group element
    people = peopleGroup.selectAll('g.person')
      .data(names.values());

    // People get given a group element when they start NCSS
    var group = people.enter().append('svg:g')
      .attr('class', 'person');
    // ...with a rectangle
    group.append('svg:rect')
      .attr('width', 200)
      .attr('height', 50);
    // ...and a label for their name
    group.append('svg:text')
      .attr('fill', 'white')
      .attr('dx', 10)
      .attr('dy', 25);

    // People's elements are positioned
    people
      .attr('title', function(person) { return person.name; })
      .attr('transform', function(person, i) { return 'translate(200, '+(i*60)+')'; })
      .each(function(person) {
        // ...and are labelled with their names
        d3.select(this).select('text')
          .text(function(person) { return person.name; })
      });


    // People have relationships
    rels = relationshipGroup.selectAll('g.relationship')
      .data(relationships);

    rels.enter().append('svg:g')
      .attr('class', 'relationship');
  }


    // Each tutoring relationship gets a path when commenced
    fellowTutorsByYear.enter().append('svg:path')
      .attr('class', 'fellow-tutor');

    // Each tutoring relationship is labelled
    fellowTutorsByYear
      .attr('name', function(tutor) { return tutor.name } );
  }

  updateGraph();
}

// Determine whether a person's role is a tutor role
function isTutor(person) {
  return person.role === "tutor" || person.role === "industry tutor" || person.role === "group leader";
}
