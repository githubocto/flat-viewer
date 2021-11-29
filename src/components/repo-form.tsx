import React from "react";
import { Formik, FormikProps, Form, Field } from "formik";
import { object, string } from "yup";
import { useHistory, Link } from "react-router-dom";
import cc from "classcat";

import { Repo } from "../types";

const initialValues: Repo = {
  owner: "",
  name: "",
};

const validationSchema = object().shape({
  owner: string().required("Please enter a repository owner"),
  name: string().optional(),
});

function RepoFormComponent(props: FormikProps<Repo>) {
  const makeFieldClass = (name: keyof Repo, index: number) =>
    cc([
      `appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:z-10 text-sm`,
      {
        "border-red-200 bg-red-50 focus:ring-red-500 focus:border-red-500":
          Boolean(props.errors[name]),
        "focus:ring-gray-500 focus:border-gray-500": !Boolean(
          props.errors[name]
        ),
        "rounded-t-md": index === 0,
        "rounded-b-md": index === 1,
      },
    ]);

  return (
    <div>
      <Form className="mt-8 space-y-4">
        <div className="rounded-md shadow-sm -space-y-px">
          <div>
            <label htmlFor="owner" className="sr-only">
              Repository owner
            </label>
            <Field
              id="owner"
              name="owner"
              type="text"
              className={makeFieldClass("owner", 0)}
              placeholder="Repository owner or organization"
            />
          </div>
          <div>
            <label htmlFor="name" className="sr-only">
              Password
            </label>
            <Field
              id="name"
              name="name"
              type="text"
              className={makeFieldClass("name", 1)}
              placeholder="Repository name"
            />
          </div>
        </div>
        <div>
          <button
            type="submit"
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-gray-900 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            View Flat Data
          </button>
        </div>
      </Form>
      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <div className="w-full border-t border-gray-300"></div>
        </div>
        <div className="relative flex justify-center">
          <span className="px-2 bg-gray-50 text-sm text-gray-500">
            or, alternatively
          </span>
        </div>
      </div>
      <div>
        <div className="text-left flex items-center space-x-2">
          <p className="text-gray-500 text-sm">Start with an example:</p>
          <div className="flex items-center space-x-2">
            <Link
              to="/githubocto/flat-demo-bitcoin-price"
              className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-900 hover:bg-gray-700 text-white font-mono focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              githubocto/flat-demo-bitcoin-price
            </Link>
          </div>
        </div>
      </div>
      <div className="mt-3 text-center text-gray-500 text-sm">
        or read <a href="https://next.github.com/projects/flat-data" className="underline">the writeup</a>
      </div>
    </div>
  );
}

export function RepoForm() {
  const history = useHistory();
  return (
    <Formik
      component={RepoFormComponent}
      initialValues={initialValues}
      validationSchema={validationSchema}
      validateOnBlur={false}
      validateOnChange={false}
      onSubmit={(values) => {
        history.push(`/${values.owner}/` + (values.name || ''))
      }}
    />
  );
}
