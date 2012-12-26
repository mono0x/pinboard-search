%{
window.Operator = {
  AND: 1,
  OR: 2,
  MATCH: 3,
  NOT: 4,
  TITLE: 5,
  TAG: 6,
  COMMENT: 7
};

%}
%lex
%%

\s+ /* skip whitespace */

"title:"   return 'TITLE';
"tag:"     return 'TAG';
"comment:" return 'COMMENT';
"OR"       return 'OR';
"("        return '(';
")"        return ')';
"-"        return '-';
<<EOF>>    return 'EOF';
[^\s()]+   return 'WORD';

/lex

%start query

%%

query : expression EOF { return $1; }
      ;

expression : term
           | expression term { $$ = [].concat($1, $2, [ Operator.AND ]); }
           ;

term : factor
     | term OR factor { $$ = [].concat($1, $3, [ Operator.OR ]); }
     ;

factor : WORD               { $$ = [ $1, Operator.MATCH ]; }
       | '-' factor         { $$ = [].concat($2, [ Operator.NOT ]); }
       | TITLE WORD         { $$ = [ $2, Operator.TITLE ]; }
       | TAG WORD           { $$ = [ $2, Operator.TAG ]; }
       | COMMENT WORD       { $$ = [ $2, Operator.COMMENT ]; }
       | '(' expression ')' { $$ = $2 }
       ;
