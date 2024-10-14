(object_reference
  name: (identifier) @type)

(object_reference)  @type

(relation
  alias: (identifier) @variable)

(field
  name: (identifier) @field)

(term
  alias: (identifier) @variable)

((term
   value: (cast
    name: (keyword_cast) @function.call
    parameter: [(literal)]?)))

(literal) @string
(comment) @comment @spell

((literal) @number
   (#match? @number "^[+-]?[0-9]+$"))

((literal) @number.float
  (#match? @number.float "[+-]?[0-9]*\.[0-9]+"))

(parameter) @parameter

[
 (keyword_true)
 (keyword_false)
] @boolean

[
 (keyword_asc)
 (keyword_desc)
] @attribute

[
 (keyword_case)
 (keyword_when)
 (keyword_then)
 (keyword_else)
 (keyword_end)
] @conditional

[
  (keyword_select)
  (keyword_allowed)
  (keyword_distinct)
  (keyword_top)
  (keyword_as)
  ; (keyword_hierarchy)
  (keyword_between)
  (keyword_is)
  (keyword_refs)
  (keyword_like)
  ; (keyword_epmtytable)
  (keyword_into)
  (keyword_drop)
  (keyword_from)
  (keyword_left)
  (keyword_right)
  (keyword_full)
  (keyword_outer)
  (keyword_join)
  (keyword_inner)
  (keyword_where)
  (keyword_group)
  (keyword_having)
  (keyword_all)
  (keyword_order)
  ; (keyword_autoorder)
  (keyword_totals)
  (keyword_overall)
  ; (keyword_only)
  ; (keyword_periods)
  ; (keyword_index)
  (keyword_for)
  (keyword_update)
  ; (keyword_escape)
  (keyword_year)
  (keyword_quarter)
  (keyword_month)
  (keyword_dayofyear)
  (keyword_day)
  (keyword_week)
  (keyword_weekday)
  (keyword_hour)
  (keyword_minute)
  (keyword_second)
  (keyword_beginofperiod)
  (keyword_endofperiod)
  (keyword_dateadd)
  (keyword_datediff)
  (keyword_sum)
  (keyword_avg)
  (keyword_min)
  (keyword_max)
  (keyword_count)
  (keyword_isnull)
  (keyword_presentation)
  (keyword_valuetype)
  (keyword_datetime)
  (keyword_grouping)
  (keyword_substring)
  (keyword_sets)
  (keyword_type)
  (keyword_value)
  (keyword_recordautonumber)
  (keyword_of)
] @keyword


[
  (keyword_number)
  (keyword_string)
  (keyword_date)
  (keyword_boolean)
] @type.builtin

[
  (keyword_null)
  (keyword_undefined)
]
 @constant.builtin

[
  (keyword_in)
  (keyword_and)
  (keyword_or)
  (keyword_not)
  (keyword_by)
  (keyword_on)
  (keyword_union)
  (keyword_refpresentation)
] @keyword.operator

[
  "+"
  "-"
  "*"
  "/"
  "="
  "<"
  "<="
  ">="
  ">"
  "<>"
] @operator

[
  "("
  ")"
] @punctuation.bracket

[
  ";"
  ","
  "."
] @punctuation.delimiter
