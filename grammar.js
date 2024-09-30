/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

module.exports = grammar({
  name: 'sdbl',

  extras: $ => [
    /\s\n/,
    /\s/,
    $.comment,
  ],

  conflicts: $ => [
    // [$.object_reference, $.all_fields],
    // [$.object_reference],
    [$.between_expression, $.binary_expression],
    [$.function_invocation]
  ],

  precedences: _ => [
    [
      'binary_is',
      'unary_not',
      'binary_times',
      'binary_plus',
      'unary_other',
      'binary_in',
      'binary_compare',
      'binary_relation',
      'pattern_matching',
      'between',
      'clause_connective',
      'clause_disjunctive',
    ],
  ],

  word: $ => $._identifier,

  rules: {
    program: $ => seq(
      repeat(
        seq(
          $.statement,
          ';',
        ),
      ),
      optional(
        $.statement,
      )
    ),

    statement: $ => choice(
      $._select_statement,
      $.drop,
    ),

    drop: $ => seq(
      $.keyword_drop,
      $.identifier
    ),

    _select_statement: $ => seq(
      $.select,
      optional($.into),
      optional($.from),
    ),

    select: $ => seq(
      $.keyword_select,
      $.select_expression,
    ),

    select_expression: $ => seq(
      optional(
        any_order(
          optional($.keyword_distinct),
          optional($.keyword_allowed),
          optional($.top_statement),
        )
      ),
      $.term,
      repeat(
        seq(
          ',',
          $.term,
        ),
      ),
    ),


    into: $ => seq(
      $.keyword_into,
      field('name', $.identifier)
    ),

    from: $ => seq(
      $.keyword_from,
      comma_list($.relation, true),
      repeat(
        $.join
      ),
      optional($.where),
      optional($.group_by),
      optional($.order_by),
      optional($.totals),
    ),

    where: $ => seq(
      $.keyword_where,
      field("predicate", $._expression),
    ),

    group_by: $ => seq(
      $.keyword_group,
      $.keyword_by,
      choice(
        seq(
          $.keyword_grouping,
          $.keyword_sets,
          $.grouping_sets
        ),
        comma_list($._expression, true),
      )
    ),

    grouping_sets: $ => wrapped_in_parenthesis(
      comma_list(
        choice(
          $.grouping_set,
          '()'
        )
      )
    ),

    grouping_set: $ => prec(3,
      optional_parenthesis(
        comma_list($._expression, true)
      )
    ),

    totals: _ => 'TODO totals',

    join: $ => seq(
      optional(
        choice(
          $.keyword_left,
          $.keyword_right,
          $.keyword_inner,
          $.keyword_full,
          seq($.keyword_full, $.keyword_outer),
          seq($.keyword_left, $.keyword_outer),
          seq($.keyword_right, $.keyword_outer),
        ),
      ),
      $.keyword_join,
      $.relation,
      optional($.join),
      seq(
        $.keyword_on,
        field("predicate", $._expression),
      ),
    ),

    relation: $ => prec.right(
      seq(
        choice(
          $.subquery,
          $.invocation,
          $.object_reference,
        ),
        optional(
          $._alias,
        ),
      ),
    ),

    order_by: $ => prec.right(seq(
      $.keyword_order,
      $.keyword_by,
      comma_list($.order_target, true),
    )),

    order_target: $ => seq(
      $._expression,
      optional(
        $.direction,
      ),
    ),

    invocation: $ => prec(1,
      seq(
        repeat(
          $._object_reference_parent
        ),
        $.object_reference,
        wrapped_in_parenthesis(
          comma_list(
            optional(
              field(
                'parameter',
                //TODO remove term
                $.term,
              )
            )
          )
        ),
      ),
    ),

    function_invocation: $ => prec(2,
      choice(
        function_type($, field('name', $.keyword_substring), ['string', 'start_position', 'size']),
        function_type($, field('name', $.keyword_year), ['date']),
        function_type($, field('name', $.keyword_quarter), ['date']),
        function_type($, field('name', $.keyword_month), ['date']),
        function_type($, field('name', $.keyword_dayofyear), ['date']),
        function_type($, field('name', $.keyword_day), ['date']),
        function_type($, field('name', $.keyword_week), ['date']),
        function_type($, field('name', $.keyword_weekday), ['date']),
        function_type($, field('name', $.keyword_hour), ['date']),
        function_type($, field('name', $.keyword_minute), ['date']),
        function_type($, field('name', $.keyword_second), ['date']),
        function_type($, field('name', $.keyword_beginofperiod), ['date']),
        function_type($, field('name', $.keyword_endofperiod), ['date']),
        function_type($, field('name', $.keyword_dateadd), ['date']),
        function_type($, field('name', $.keyword_datediff), ['date']),
        function_type($, field('name', $.keyword_sum)),
        function_type($, field('name', $.keyword_min)),
        function_type($, field('name', $.keyword_max)),
        function_type($, field('name', $.keyword_avg)),
        function_type($, field('name', $.keyword_isnull), ['expression', 'expression']),
        function_type($, field('name', $.keyword_presentation)),
        function_type($, field('name', $.keyword_refpresentation)),
        function_type($, field('name', $.keyword_valuetype)),
        function_type($, field('name', $.keyword_datetime), ['year', 'month', 'day', 'hour', 'minute', 'second']),
        function_type($, field('name', $.keyword_value), ['name']),
        function_type($, field('name', $.keyword_type), ['name']),
        function_type($, field('name', $.keyword_recordautonumber), []),
      )
    ),

    top_statement: $ => seq(
      $.keyword_top,
      $.natural_number,
    ),

    term: $ => seq(
      field(
        'value',
        choice(
          $.all_fields,
          $._expression,
        ),
      ),
      optional($._alias),
    ),

    _alias: $ => seq(
      optional($.keyword_as),
      field('alias', $.identifier),
    ),

    _expression: $ => prec(1,
      choice(
        $.literal,
        $.field,
        $.parameter,
        $.case,
        //TODO remove subqery, it's not allowed in most cases
        $.subquery,
        $.cast,
        $.count,
        $.invocation,
        $.function_invocation,
        $.binary_expression,
        $.unary_expression,
        $.between_expression,
        $.refs_expression,
        $.parenthesized_expression,
      )
    ),

    parenthesized_expression: $ => prec(2,
      wrapped_in_parenthesis($._expression)
    ),

    binary_expression: $ => choice(
      ...[
        ['+', 'binary_plus'],
        ['-', 'binary_plus'],
        ['*', 'binary_times'],
        ['/', 'binary_times'],
        ['=', 'binary_relation'],
        ['<', 'binary_relation'],
        ['<=', 'binary_relation'],
        ['>=', 'binary_relation'],
        ['>', 'binary_relation'],
        ['<>', 'binary_relation'],
        [$.keyword_is, 'binary_is'],
        [$.is_not, 'binary_is'],
        [$.keyword_like, 'pattern_matching'],
        [$.not_like, 'pattern_matching'],
      ].map(([operator, precedence]) =>
        // @ts-ignore
        prec.left(precedence, seq(
          field('left', $._expression),
          field('operator', operator),
          field('right', $._expression)
        ))
      ),
      ...[
        [$.keyword_and, 'clause_connective'],
        [$.keyword_or, 'clause_disjunctive'],
      ].map(([operator, precedence]) =>
        // @ts-ignore
        prec.left(precedence, seq(
          field('left', $._expression),
          field('operator', operator),
          field('right', $._expression)
        ))
      ),
      ...[
        [$.keyword_in, 'binary_in'],
        [$.not_in, 'binary_in'],
      ].map(([operator, precedence]) =>
        // @ts-ignore
        prec.left(precedence, seq(
          field('left', $._expression),
          field('operator', operator),
          field('right', choice($.list, $.subquery))
        ))
      ),
    ),

    is_not: $ => prec.left(
      seq(
        $.keyword_is,
        $.keyword_not
      )
    ),

    not_like: $ => prec.left(
      seq(
        $.keyword_not,
        $.keyword_like
      )
    ),

    not_in: $ => prec.left(
      seq(
        $.keyword_not,
        $.keyword_in,
      )
    ),

    unary_expression: $ => prec.left('unary_not',
      seq(
        field('operator', $.keyword_not),
        field('operand', $._expression),
      )
    ),

    between_expression: $ => choice(
      ...[
        [$.keyword_between, 'between'],
        [seq($.keyword_not, $.keyword_between), 'between'],
      ].map(([operator, precedence]) =>
        // @ts-ignore
        prec.left(precedence, seq(
          field('left', $._expression),
          field('operator', operator),
          field('low', $._expression),
          $.keyword_and,
          field('high', $._expression)
        ))
      ),
    ),

    //TODO add tests
    refs_expression: $ => seq(
      field('left', $._expression),
      field('operator', $.keyword_refs),
      field('value', $.field)
    ),

    list: $ => wrapped_in_parenthesis(comma_list($._expression, true)),

    cast: $ => seq(
      field('name', $.keyword_cast),
      wrapped_in_parenthesis(
        seq(
          field('parameter', $._expression),
          $.keyword_as,
          $._type,
        ),
      ),
    ),

    count: $ => seq(
      field('name', $.keyword_count),
      wrapped_in_parenthesis(
        seq(
          optional($.keyword_distinct),
          optional_parenthesis(
            field('expression', $.term),
          )
        )
      ),
    ),

    _type: $ => choice(
      $.string,
      $.number,
      $.keyword_date,
      $.keyword_boolean,
    ),

    case: $ => seq(
      $.keyword_case,
      choice(
        // simplified CASE x WHEN
        seq(
          $._expression,
          $.keyword_when,
          $._expression,
          $.keyword_then,
          $._expression,
          repeat(
            seq(
              $.keyword_when,
              $._expression,
              $.keyword_then,
              $._expression,
            )
          ),
        ),
        // standard CASE WHEN x, where x must be a predicate
        seq(
          $.keyword_when,
          $._expression,
          $.keyword_then,
          $._expression,
          repeat(
            seq(
              $.keyword_when,
              $._expression,
              $.keyword_then,
              $._expression,
            )
          ),
        ),
      ),
      optional(
        seq(
          $.keyword_else,
          $._expression,
        )
      ),
      $.keyword_end,
    ),

    subquery: $ => wrapped_in_parenthesis(
      $._select_statement
    ),

    literal: $ => prec(2,
      choice(
        $._natural_number,
        $._decimal_number,
        $._literal_string,
        $.keyword_true,
        $.keyword_false,
        $.keyword_null,
      ),
    ),

    _literal_string: _ => /"(""|[^"])*"/,

    natural_number: $ => $._natural_number,

    _natural_number: _ => seq(
      optional("-"),
      /\d+/
    ),

    _decimal_number: _ => seq(
      optional(
        choice("-", "+")),
      /((\d+(_\d+)*)?[.]\d+(_\d+)*(e[+-]?\d+(_\d+)*)?)|(\d+(_\d+)*[.](e[+-]?\d+(_\d+)*)?)/
    ),

    all_fields: $ => seq(
      repeat(
        $._object_reference_parent,
      ),
      '*',
    ),

    field: $ => seq(
      repeat(
        $._object_reference_parent,
      ),
      field('name', $.identifier),
    ),

    //TODO object reference should be with optional multiple parents
    object_reference: $ => field('name', $.identifier),

    _object_reference_parent: $ => seq(
      $.object_reference,
      '.',
    ),

    keyword_select: _ => make_keyword_en_ru("select", "выбрать"),
    keyword_allowed: _ => make_keyword_en_ru("allowed", "разрешенные"),
    keyword_distinct: _ => make_keyword_en_ru("distinct", "различные"),
    keyword_top: _ => make_keyword_en_ru("top", "первые"),
    keyword_undefined: _ => make_keyword_en_ru("undefined", "неопределено"),
    keyword_true: _ => make_keyword_en_ru("true", "истина"),
    keyword_false: _ => make_keyword_en_ru("false", "ложь"),
    keyword_as: _ => make_keyword_en_ru("as", "как"),
    keyword_not: _ => make_keyword_en_ru("not", "не"),
    keyword_and: _ => make_keyword_en_ru("and", "и"),
    keyword_or: _ => make_keyword_en_ru("or", "или"),
    keyword_in: _ => make_keyword_en_ru("in", "в"),
    keyword_hierarchy: _ => make_keyword_en_ru("hierarchy", "иерархии"),
    keyword_between: _ => make_keyword_en_ru("between", "между"),
    keyword_is: _ => make_keyword_en_ru("is", "есть"),
    keyword_refs: _ => make_keyword_en_ru("refs", "ссылка"),
    keyword_like: _ => make_keyword_en_ru("like", "подобно"),
    keyword_epmtytable: _ => make_keyword_en_ru("epmtytable", "пустаятаблица"),
    keyword_into: _ => make_keyword_en_ru("into", "поместить"),
    keyword_drop: _ => make_keyword_en_ru("drop", "уничтожить"),
    keyword_from: _ => make_keyword_en_ru("from", "из"),
    keyword_left: _ => make_keyword_en_ru("left", "левое"),
    keyword_right: _ => make_keyword_en_ru("right", "правое"),
    keyword_full: _ => make_keyword_en_ru("full", "полное"),
    keyword_outer: _ => make_keyword_en_ru("outer", "внешнее"),
    keyword_join: _ => make_keyword_en_ru("join", "соединение"),
    keyword_inner: _ => make_keyword_en_ru("inner", "внутреннее"),
    keyword_where: _ => make_keyword_en_ru("where", "где"),
    keyword_group: _ => make_keyword_en_ru("group", "сгруппировать"),
    keyword_on: _ => make_keyword_en_ru("on", "по"),
    keyword_by: _ => make_keyword_en_ru("by", "по"),
    keyword_having: _ => make_keyword_en_ru("having", "имеющие"),
    keyword_union: _ => make_keyword_en_ru("union", "объединить"),
    keyword_all: _ => make_keyword_en_ru("all", "все"),
    keyword_order: _ => make_keyword_en_ru("order", "упорядочить"),
    keyword_autoorder: _ => make_keyword_en_ru("autoorder", "автоупорядочивание"),
    keyword_totals: _ => make_keyword_en_ru("totals", "итоги"),
    keyword_overall: _ => make_keyword_en_ru("overall", "общие"),
    keyword_only: _ => make_keyword_en_ru("only", "только"),
    keyword_periods: _ => make_keyword_en_ru("periods", "периодами"),
    keyword_index: _ => make_keyword_en_ru("index", "индексировать"),
    keyword_cast: _ => make_keyword_en_ru("cast", "выразить"),
    keyword_asc: _ => make_keyword_en_ru("asc", "возр"),
    keyword_desc: _ => make_keyword_en_ru("desc", "убыв"),
    keyword_for: _ => make_keyword_en_ru("for", "для"),
    keyword_update: _ => make_keyword_en_ru("update", "изменения"),
    keyword_escape: _ => make_keyword_en_ru("escape", "спецсимвол"),
    keyword_year: _ => make_keyword_en_ru("year", "год"),
    keyword_quarter: _ => make_keyword_en_ru("quarter", "квартал"),
    keyword_month: _ => make_keyword_en_ru("month", "месяц"),
    keyword_dayofyear: _ => make_keyword_en_ru("dayofyear", "деньгода"),
    keyword_day: _ => make_keyword_en_ru("day", "день"),
    keyword_week: _ => make_keyword_en_ru("week", "неделя"),
    keyword_weekday: _ => make_keyword_en_ru("weekday", "деньнедели"),
    keyword_hour: _ => make_keyword_en_ru("hour", "час"),
    keyword_minute: _ => make_keyword_en_ru("minute", "минута"),
    keyword_second: _ => make_keyword_en_ru("second", "секунда"),
    keyword_beginofperiod: _ => make_keyword_en_ru("beginofperiod", "началопериода"),
    keyword_endofperiod: _ => make_keyword_en_ru("endofperiod", "конецпериода"),
    keyword_dateadd: _ => make_keyword_en_ru("dateadd", "добавитькдате"),
    keyword_datediff: _ => make_keyword_en_ru("datediff", "разностьдат"),
    keyword_sum: _ => make_keyword_en_ru("sum", "сумма"),
    keyword_avg: _ => make_keyword_en_ru("avg", "среднее"),
    keyword_min: _ => make_keyword_en_ru("min", "минимум"),
    keyword_max: _ => make_keyword_en_ru("max", "максимум"),
    keyword_count: _ => make_keyword_en_ru("count", "количество"),
    keyword_isnull: _ => make_keyword_en_ru("isnull", "естьnull"),
    keyword_presentation: _ => make_keyword_en_ru("presentation", "представление"),
    keyword_refpresentation: _ => make_keyword_en_ru("refpresentation", "представлениессылки"),
    keyword_valuetype: _ => make_keyword_en_ru("valuetype", "типзначения"),
    keyword_number: _ => make_keyword_en_ru("number", "число"),
    keyword_string: _ => make_keyword_en_ru("string", "строка"),
    keyword_date: _ => make_keyword_en_ru("date", "дата"),
    keyword_case: _ => make_keyword_en_ru("case", "выбор"),
    keyword_when: _ => make_keyword_en_ru("when", "когда"),
    keyword_then: _ => make_keyword_en_ru("then", "тогда"),
    keyword_else: _ => make_keyword_en_ru("else", "иначе"),
    keyword_datetime: _ => make_keyword_en_ru("datetime", "датавремя"),
    keyword_end: _ => make_keyword_en_ru("end", "конец"),
    keyword_boolean: _ => make_keyword_en_ru("boolean", "булево"),
    keyword_grouping: _ => make_keyword_en_ru("grouping", "группирующим"),
    keyword_substring: _ => make_keyword_en_ru("substring", "подстрока"),
    keyword_sets: _ => make_keyword_en_ru("sets", "наборам"),
    keyword_type: _ => make_keyword_en_ru("type", "тип"),
    keyword_value: _ => make_keyword_en_ru("value", "значение"),
    keyword_recordautonumber: _ => make_keyword_en_ru("recordautonumber", "автономерзаписи"),

    keyword_null: _ => make_keyword("null"),
    keyword_of: _ => make_keyword("of"),

    direction: $ => choice($.keyword_desc, $.keyword_asc),

    parameter: $ => seq('&', $._identifier),

    identifier: $ => $._identifier,

    _identifier: _ => /[a-zA-Zа-яА-ЯіІїЇєЄґҐщЩЁё_][0-9a-zA-Zа-яА-ЯіІїЇєЄґҐщЩЁё_]*/,

    comment: _ => /\/\/.*/,

    //types
    string: $ => parametric_type($, $.keyword_string),
    number: $ => parametric_type($, $.keyword_number, ['size', 'precision']),
  }
});

/**
 * @param {string} word
 */
function make_keyword(word) {
  var str = "";
  for (var i = 0; i < word.length; i++) {
    str = str + "[" + word.charAt(i).toLowerCase() + word.charAt(i).toUpperCase() + "]";
  }
  return new RegExp(str);
}

/**
 * @param {string} word_en
 * @param {string} word_ru
 */
function make_keyword_en_ru(word_en, word_ru) {
  return choice(make_keyword(word_en), make_keyword(word_ru));
}

/**
 * @param {RuleOrLiteral[]} rules
 */
function any_order(...rules) {
  return choice(...every_combination(rules).map((v) => seq(...v)))
}

/**
 * @param {RuleOrLiteral} node
 */
function wrapped_in_parenthesis(node) {
  if (node) {
    return seq("(", node, ")");
  }
  return seq("(", ")");
}

/**
 * @param {RuleOrLiteral} node
 */
function optional_parenthesis(node) {
  return prec.right(
    choice(
      node,
      wrapped_in_parenthesis(node),
    ),
  )
}

/**
 * @param {RuleOrLiteral} field
 * @param {boolean} requireFirst
 */
function comma_list(field, requireFirst = false) {
  var sequence = seq(field, repeat(seq(',', field)));

  if (requireFirst) {
    return sequence;
  }

  return optional(sequence);
}

/**
 * @param {GrammarSymbols<string>} $
 * @param {RuleOrLiteral} type
 * @param {Array.<string>} params
 */
function parametric_type($, type, params = ['size']) {
  return function_node(type, alias($._natural_number, $.literal), params)
}

/**
 * @param {GrammarSymbols<string>} $
 * @param {RuleOrLiteral} type
 * @param {Array.<string>} params
 */
function function_type($, type, params = ['expression']) {
  if (params.length == 0) {
    return (seq(type, '()'))
  }
  return function_node(type, choice($.literal, $.field, $.parameter), params)
}

/**
 * @param {RuleOrLiteral} type
 * @param {RuleOrLiteral} params_type
 * @param {Array.<string>} params
 */
function function_node(type, params_type, params) {
  if (params.length == 0) {
    throw new Error('Params should not be empty!')
  }
  return prec.right(1,
    choice(
      type,
      seq(
        type,
        wrapped_in_parenthesis(
          seq(
            // first parameter is guaranteed, shift it out of the array
            // @ts-ignore
            field(params.shift(), params_type),
            // then, fill in the ", next" until done
            ...params.map(p => optional(seq(',', field(p, params_type)))),
          ),
        ),
      ),
    ),
  )
}

/**
 * @param {Array.<T>} arr
 * @return {Array.<Array.<T>>}
 * @template T
 */
function every_combination(arr) {
  if (arr.length == 1) {
    return [arr]
  }
  var combinations = [];
  var every_other_value = [];
  var item;
  while ((item = arr.shift()) != null) {
    for (const combination of every_combination(arr.concat(every_other_value))) {
      // @ts-ignore
      combinations.push([item].concat(combination));
    }
    every_other_value.push(item);
  }
  return combinations
}
