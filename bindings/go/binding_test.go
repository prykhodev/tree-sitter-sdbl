package tree_sitter_sdbl_test

import (
	"testing"

	tree_sitter "github.com/tree-sitter/go-tree-sitter"
	tree_sitter_sdbl "github.com/tree-sitter/tree-sitter-sdbl/bindings/go"
)

func TestCanLoadGrammar(t *testing.T) {
	language := tree_sitter.NewLanguage(tree_sitter_sdbl.Language())
	if language == nil {
		t.Errorf("Error loading Sdbl grammar")
	}
}
