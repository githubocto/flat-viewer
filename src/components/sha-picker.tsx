import React from "react";
import { useSelect, UseSelectStateChange } from "downshift";
import { ChevronDownIcon, CommitIcon, CheckIcon } from "@primer/octicons-react";
import { usePopper } from "react-popper";
import cc from "classcat";
import formatDistance from "date-fns/formatDistance";

import { Commit } from "../types";

interface SHAPickerProps {
  commits: Commit[];
  value?: string;
  onChange: (sha: string) => void;
}

export function SHAPicker(props: SHAPickerProps) {
  const { commits, value, onChange } = props;
  const items = commits.map((commit) => commit.sha);

  const handleSelectedItemChange = (changes: UseSelectStateChange<string>) => {
    if (changes.selectedItem) {
      onChange(changes.selectedItem);
    }
  };

  const {
    isOpen,
    getToggleButtonProps,
    getLabelProps,
    getMenuProps,
    highlightedIndex,
    getItemProps,
  } = useSelect({
    items,
    selectedItem: value,
    onSelectedItemChange: handleSelectedItemChange,
  });

  const [
    referenceElement,
    setReferenceElement,
  ] = React.useState<HTMLDivElement | null>(null);
  const [
    popperElement,
    setPopperElement,
  ] = React.useState<HTMLDivElement | null>(null);

  const { styles, attributes, forceUpdate } = usePopper(
    referenceElement,
    popperElement,
    {
      placement: "bottom-start",
      modifiers: [
        {
          name: "offset",
          options: {
            offset: [0, 4],
          },
        },
      ],
    }
  );

  // Popper has the wrong position on mount, this hack seems to fix it...
  React.useEffect(() => {
    if (isOpen && forceUpdate) {
      forceUpdate();
    }
  }, [isOpen, forceUpdate]);

  const augmentSha = React.useCallback(
    (sha?: string) => {
      if (!sha) return null;
      return commits.find((commit) => commit.sha === sha);
    },
    [commits]
  );

  return (
    <div className="relative" ref={setReferenceElement}>
      <label className="sr-only" {...getLabelProps()}>
        Choose a commit
      </label>
      <button
        type="button"
        {...getToggleButtonProps()}
        className="bg-white relative w-full border border-gray-300 rounded-md shadow-sm pl-3 pr-10 py-2 text-left cursor-default focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
      >
        <div className="flex items-center space-x-2">
          <CommitIcon />
          <span className="block truncate">
            <span>{augmentSha(value)?.commit.message}</span>
          </span>
        </div>
        <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
          <ChevronDownIcon />
        </span>
      </button>
      <div
        className={cc([
          "w-full bg-white z-10 m-0",
          {
            "sr-only": !isOpen,
          },
        ])}
        style={styles.popper}
        ref={setPopperElement}
        {...attributes.popper}
      >
        <div className="w-full rounded-md bg-white shadow-lg max-h-48">
          <ul
            className="rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm max-h-48 overflow-auto"
            {...getMenuProps()}
          >
            {items.map((item, index) => {
              const isHighlighted = highlightedIndex === index;
              const isSelected = value === item;
              const augmentedValue = augmentSha(item);

              return (
                <li
                  className={cc([
                    "cursor-default select-none relative py-2 pl-3 pr-9 text-sm",
                    {
                      "text-white bg-indigo-600": isHighlighted,
                      "text-gray-700": !isHighlighted && !isSelected,
                    },
                  ])}
                  key={`${item}${index}`}
                  {...getItemProps({ item, index })}
                >
                  <div className={cc(["block truncate text-sm font-normal"])}>
                    <div className="flex flex-col space-y-2">
                      <span>{augmentedValue?.commit.message}</span>
                      <div className="flex items-center space-x-2">
                        <div className="flex items-center space-x-2">
                          <img
                            className="w-4 h-4 rounded-full"
                            src={`https://github.com/${augmentedValue?.commit.author?.name}.png`}
                            alt={
                              augmentedValue?.commit.author?.name ||
                              "Committer avatar"
                            }
                          />
                          <p className="text-xs">
                            <span className="font-medium">
                              {augmentedValue?.commit.author?.name}
                            </span>
                            <span className="ml-1">
                              {formatDistance(
                                new Date(
                                  augmentedValue?.commit.author?.date || ""
                                ),
                                new Date(),
                                { addSuffix: true }
                              )}
                            </span>
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {value === item && (
                    <span
                      className={cc([
                        "absolute inset-y-0 right-0 flex items-center pr-4",
                        {
                          "text-indigo-600": !isHighlighted,
                          "text-white": isHighlighted,
                        },
                      ])}
                    >
                      <CheckIcon />
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}
