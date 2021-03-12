import React from "react";
import { Formik, FormikProps, Form, Field } from "formik";
import { object, string } from "yup";
import { useHistory } from "react-router";

import { Repo } from "../types";

const initialValues: Repo = {
  owner: "",
  name: "",
};

const validationSchema = object().shape({
  owner: string().required("Please enter a repository owner"),
  name: string().required("Please enter a repository name"),
});

function RepoFormComponent(props: FormikProps<Repo>) {
  return (
    <Form className="mt-8 space-y-6">
      <div className="rounded-md shadow-sm -space-y-px">
        <div>
          <label htmlFor="owner" className="sr-only">
            Repository owner
          </label>
          <Field
            id="owner"
            name="owner"
            type="text"
            className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-gray-500 focus:border-gray-500 focus:z-10 sm:text-sm"
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
            className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-gray-500 focus:border-gray-500 focus:z-10 sm:text-sm"
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
        history.push(`/${values.owner}/${values.name}`);
      }}
    />
  );
}
