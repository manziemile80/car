export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      assignment_submissions: {
        Row: {
          answer_text: string | null
          assignment_id: string
          created_at: string
          feedback: string | null
          file_url: string | null
          graded_by: string | null
          id: string
          points_awarded: number | null
          student_id: string
          submitted_at: string
          updated_at: string
        }
        Insert: {
          answer_text?: string | null
          assignment_id: string
          created_at?: string
          feedback?: string | null
          file_url?: string | null
          graded_by?: string | null
          id?: string
          points_awarded?: number | null
          student_id: string
          submitted_at?: string
          updated_at?: string
        }
        Update: {
          answer_text?: string | null
          assignment_id?: string
          created_at?: string
          feedback?: string | null
          file_url?: string | null
          graded_by?: string | null
          id?: string
          points_awarded?: number | null
          student_id?: string
          submitted_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "assignment_submissions_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignment_submissions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_cumulative_scores"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "assignment_submissions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      assignments: {
        Row: {
          class_id: string | null
          course_id: string | null
          created_at: string
          created_by: string
          due_date: string | null
          id: string
          instructions: string | null
          is_published: boolean
          max_points: number
          subject_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          class_id?: string | null
          course_id?: string | null
          created_at?: string
          created_by: string
          due_date?: string | null
          id?: string
          instructions?: string | null
          is_published?: boolean
          max_points?: number
          subject_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          class_id?: string | null
          course_id?: string | null
          created_at?: string
          created_by?: string
          due_date?: string | null
          id?: string
          instructions?: string | null
          is_published?: boolean
          max_points?: number
          subject_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "assignments_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance: {
        Row: {
          academic_year: string | null
          attendance_date: string
          class_id: string | null
          created_at: string
          id: string
          notes: string | null
          recorded_by: string
          status: Database["public"]["Enums"]["attendance_status"]
          student_id: string
          term: Database["public"]["Enums"]["school_term"] | null
        }
        Insert: {
          academic_year?: string | null
          attendance_date?: string
          class_id?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          recorded_by: string
          status?: Database["public"]["Enums"]["attendance_status"]
          student_id: string
          term?: Database["public"]["Enums"]["school_term"] | null
        }
        Update: {
          academic_year?: string | null
          attendance_date?: string
          class_id?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          recorded_by?: string
          status?: Database["public"]["Enums"]["attendance_status"]
          student_id?: string
          term?: Database["public"]["Enums"]["school_term"] | null
        }
        Relationships: [
          {
            foreignKeyName: "attendance_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_cumulative_scores"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "attendance_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      behavior_scores: {
        Row: {
          category: Database["public"]["Enums"]["behavior_category"]
          created_at: string
          id: string
          notes: string | null
          score: number
          score_date: string
          student_id: string
          teacher_id: string
          updated_at: string
        }
        Insert: {
          category: Database["public"]["Enums"]["behavior_category"]
          created_at?: string
          id?: string
          notes?: string | null
          score: number
          score_date?: string
          student_id: string
          teacher_id: string
          updated_at?: string
        }
        Update: {
          category?: Database["public"]["Enums"]["behavior_category"]
          created_at?: string
          id?: string
          notes?: string | null
          score?: number
          score_date?: string
          student_id?: string
          teacher_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "behavior_scores_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_cumulative_scores"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "behavior_scores_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "behavior_scores_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      class_subjects: {
        Row: {
          academic_year: string
          class_id: string
          created_at: string
          id: string
          subject_id: string
          teacher_id: string | null
        }
        Insert: {
          academic_year: string
          class_id: string
          created_at?: string
          id?: string
          subject_id: string
          teacher_id?: string | null
        }
        Update: {
          academic_year?: string
          class_id?: string
          created_at?: string
          id?: string
          subject_id?: string
          teacher_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "class_subjects_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_subjects_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      classes: {
        Row: {
          academic_year: string
          created_at: string
          grade_level: string
          id: string
          name: string
          teacher_id: string | null
          updated_at: string
        }
        Insert: {
          academic_year: string
          created_at?: string
          grade_level: string
          id?: string
          name: string
          teacher_id?: string | null
          updated_at?: string
        }
        Update: {
          academic_year?: string
          created_at?: string
          grade_level?: string
          id?: string
          name?: string
          teacher_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      courses: {
        Row: {
          academic_year: string
          class_id: string | null
          created_at: string
          description: string | null
          id: string
          is_published: boolean
          subject_id: string | null
          teacher_id: string
          term: Database["public"]["Enums"]["school_term"] | null
          title: string
          updated_at: string
        }
        Insert: {
          academic_year?: string
          class_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_published?: boolean
          subject_id?: string | null
          teacher_id: string
          term?: Database["public"]["Enums"]["school_term"] | null
          title: string
          updated_at?: string
        }
        Update: {
          academic_year?: string
          class_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_published?: boolean
          subject_id?: string | null
          teacher_id?: string
          term?: Database["public"]["Enums"]["school_term"] | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "courses_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "courses_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      email_notifications: {
        Row: {
          behavior_score_id: string
          created_at: string
          email_address: string
          error_message: string | null
          id: string
          is_sms_backup: boolean
          message: string
          parent_id: string
          resend_message_id: string | null
          sent_at: string | null
          status: string
          subject: string
        }
        Insert: {
          behavior_score_id: string
          created_at?: string
          email_address: string
          error_message?: string | null
          id?: string
          is_sms_backup?: boolean
          message: string
          parent_id: string
          resend_message_id?: string | null
          sent_at?: string | null
          status?: string
          subject: string
        }
        Update: {
          behavior_score_id?: string
          created_at?: string
          email_address?: string
          error_message?: string | null
          id?: string
          is_sms_backup?: boolean
          message?: string
          parent_id?: string
          resend_message_id?: string | null
          sent_at?: string | null
          status?: string
          subject?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_notifications_behavior_score_id_fkey"
            columns: ["behavior_score_id"]
            isOneToOne: false
            referencedRelation: "behavior_scores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_notifications_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "parents"
            referencedColumns: ["id"]
          },
        ]
      }
      lessons: {
        Row: {
          attachment_url: string | null
          content: string | null
          course_id: string
          created_at: string
          id: string
          sort_order: number
          title: string
          updated_at: string
          video_url: string | null
        }
        Insert: {
          attachment_url?: string | null
          content?: string | null
          course_id: string
          created_at?: string
          id?: string
          sort_order?: number
          title: string
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          attachment_url?: string | null
          content?: string | null
          course_id?: string
          created_at?: string
          id?: string
          sort_order?: number
          title?: string
          updated_at?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lessons_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      marks: {
        Row: {
          academic_year: string
          cat_score: number
          created_at: string
          exam_score: number
          id: string
          remarks: string | null
          student_id: string
          subject_id: string
          teacher_id: string
          term: Database["public"]["Enums"]["school_term"]
          updated_at: string
        }
        Insert: {
          academic_year: string
          cat_score?: number
          created_at?: string
          exam_score?: number
          id?: string
          remarks?: string | null
          student_id: string
          subject_id: string
          teacher_id: string
          term: Database["public"]["Enums"]["school_term"]
          updated_at?: string
        }
        Update: {
          academic_year?: string
          cat_score?: number
          created_at?: string
          exam_score?: number
          id?: string
          remarks?: string | null
          student_id?: string
          subject_id?: string
          teacher_id?: string
          term?: Database["public"]["Enums"]["school_term"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "marks_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_cumulative_scores"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "marks_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marks_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      materials: {
        Row: {
          class_id: string | null
          course_id: string | null
          created_at: string
          description: string | null
          file_url: string | null
          id: string
          subject_id: string | null
          title: string
          updated_at: string
          uploaded_by: string
        }
        Insert: {
          class_id?: string | null
          course_id?: string | null
          created_at?: string
          description?: string | null
          file_url?: string | null
          id?: string
          subject_id?: string | null
          title: string
          updated_at?: string
          uploaded_by: string
        }
        Update: {
          class_id?: string | null
          course_id?: string | null
          created_at?: string
          description?: string | null
          file_url?: string | null
          id?: string
          subject_id?: string | null
          title?: string
          updated_at?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "materials_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "materials_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "materials_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      parents: {
        Row: {
          address: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          phone: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string
          email: string
          full_name: string
          id?: string
          phone: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          phone?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name: string
          id?: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      purchase_orders: {
        Row: {
          created_at: string
          created_by: string
          expected_date: string | null
          id: string
          item_id: string
          notes: string | null
          quantity: number
          status: string
          supplier: string | null
          unit_price: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          expected_date?: string | null
          id?: string
          item_id: string
          notes?: string | null
          quantity: number
          status?: string
          supplier?: string | null
          unit_price?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          expected_date?: string | null
          id?: string
          item_id?: string
          notes?: string | null
          quantity?: number
          status?: string
          supplier?: string | null
          unit_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchase_orders_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "stock_items"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_attempts: {
        Row: {
          answers: Json
          completed_at: string
          created_at: string
          id: string
          quiz_id: string
          score: number
          student_id: string
          total_points: number
          updated_at: string
        }
        Insert: {
          answers?: Json
          completed_at?: string
          created_at?: string
          id?: string
          quiz_id: string
          score?: number
          student_id: string
          total_points?: number
          updated_at?: string
        }
        Update: {
          answers?: Json
          completed_at?: string
          created_at?: string
          id?: string
          quiz_id?: string
          score?: number
          student_id?: string
          total_points?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_attempts_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_attempts_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_cumulative_scores"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "quiz_attempts_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_questions: {
        Row: {
          correct_option: string
          created_at: string
          id: string
          option_a: string
          option_b: string
          option_c: string | null
          option_d: string | null
          points: number
          question_text: string
          quiz_id: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          correct_option: string
          created_at?: string
          id?: string
          option_a: string
          option_b: string
          option_c?: string | null
          option_d?: string | null
          points?: number
          question_text: string
          quiz_id: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          correct_option?: string
          created_at?: string
          id?: string
          option_a?: string
          option_b?: string
          option_c?: string | null
          option_d?: string | null
          points?: number
          question_text?: string
          quiz_id?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_questions_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quizzes: {
        Row: {
          class_id: string | null
          course_id: string | null
          created_at: string
          created_by: string
          description: string | null
          id: string
          is_published: boolean
          subject_id: string | null
          time_limit_minutes: number | null
          title: string
          updated_at: string
        }
        Insert: {
          class_id?: string | null
          course_id?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          is_published?: boolean
          subject_id?: string | null
          time_limit_minutes?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          class_id?: string | null
          course_id?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          is_published?: boolean
          subject_id?: string | null
          time_limit_minutes?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quizzes_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quizzes_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quizzes_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      report_remarks: {
        Row: {
          academic_year: string
          class_teacher_remark: string | null
          created_at: string
          id: string
          principal_remark: string | null
          student_id: string
          term: Database["public"]["Enums"]["school_term"]
          updated_at: string
        }
        Insert: {
          academic_year: string
          class_teacher_remark?: string | null
          created_at?: string
          id?: string
          principal_remark?: string | null
          student_id: string
          term: Database["public"]["Enums"]["school_term"]
          updated_at?: string
        }
        Update: {
          academic_year?: string
          class_teacher_remark?: string | null
          created_at?: string
          id?: string
          principal_remark?: string | null
          student_id?: string
          term?: Database["public"]["Enums"]["school_term"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "report_remarks_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_cumulative_scores"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "report_remarks_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      sms_notifications: {
        Row: {
          behavior_score_id: string
          created_at: string
          error_message: string | null
          id: string
          message: string
          parent_id: string
          phone_number: string
          sent_at: string | null
          status: string
        }
        Insert: {
          behavior_score_id: string
          created_at?: string
          error_message?: string | null
          id?: string
          message: string
          parent_id: string
          phone_number: string
          sent_at?: string | null
          status?: string
        }
        Update: {
          behavior_score_id?: string
          created_at?: string
          error_message?: string | null
          id?: string
          message?: string
          parent_id?: string
          phone_number?: string
          sent_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "sms_notifications_behavior_score_id_fkey"
            columns: ["behavior_score_id"]
            isOneToOne: false
            referencedRelation: "behavior_scores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sms_notifications_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "parents"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_items: {
        Row: {
          category: string
          created_at: string
          created_by: string
          id: string
          location: string | null
          min_quantity: number
          name: string
          notes: string | null
          quantity: number
          unit: string
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          created_by: string
          id?: string
          location?: string | null
          min_quantity?: number
          name: string
          notes?: string | null
          quantity?: number
          unit?: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          created_by?: string
          id?: string
          location?: string | null
          min_quantity?: number
          name?: string
          notes?: string | null
          quantity?: number
          unit?: string
          updated_at?: string
        }
        Relationships: []
      }
      stock_movements: {
        Row: {
          created_at: string
          id: string
          item_id: string
          movement_date: string
          movement_type: string
          quantity: number
          reason: string | null
          recorded_by: string
        }
        Insert: {
          created_at?: string
          id?: string
          item_id: string
          movement_date?: string
          movement_type: string
          quantity: number
          reason?: string | null
          recorded_by: string
        }
        Update: {
          created_at?: string
          id?: string
          item_id?: string
          movement_date?: string
          movement_type?: string
          quantity?: number
          reason?: string | null
          recorded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_movements_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "stock_items"
            referencedColumns: ["id"]
          },
        ]
      }
      student_parents: {
        Row: {
          created_at: string
          id: string
          is_primary_contact: boolean
          parent_id: string
          relationship: string
          student_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_primary_contact?: boolean
          parent_id: string
          relationship?: string
          student_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_primary_contact?: boolean
          parent_id?: string
          relationship?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_parents_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "parents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_parents_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_cumulative_scores"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "student_parents_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          class_id: string | null
          created_at: string
          date_of_birth: string | null
          enrollment_date: string
          first_name: string
          id: string
          last_name: string
          status: string
          student_id: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          class_id?: string | null
          created_at?: string
          date_of_birth?: string | null
          enrollment_date?: string
          first_name: string
          id?: string
          last_name: string
          status?: string
          student_id: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          class_id?: string | null
          created_at?: string
          date_of_birth?: string | null
          enrollment_date?: string
          first_name?: string
          id?: string
          last_name?: string
          status?: string
          student_id?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "students_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      subjects: {
        Row: {
          code: string
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      student_cumulative_scores: {
        Row: {
          cumulative_score: number | null
          entries_count: number | null
          last_score_date: string | null
          remaining_marks: number | null
          student_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      can_manage_stock: { Args: { _user_id: string }; Returns: boolean }
      get_current_student_id: { Args: { _user_id: string }; Returns: string }
      get_parent_student_ids: { Args: { _user_id: string }; Returns: string[] }
      get_student_cumulative_score: {
        Args: { _student_id: string }
        Returns: number
      }
      get_student_term_position: {
        Args: {
          _academic_year: string
          _student_id: string
          _term: Database["public"]["Enums"]["school_term"]
        }
        Returns: {
          rank_position: number
          student_average: number
          total_students: number
        }[]
      }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_staff: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role:
        | "admin"
        | "teacher"
        | "parent"
        | "viewer"
        | "student"
        | "stock_manager"
      attendance_status: "present" | "absent" | "late" | "excused"
      behavior_category:
        | "discipline"
        | "respect"
        | "attendance"
        | "participation"
      school_term: "term1" | "term2" | "term3"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: [
        "admin",
        "teacher",
        "parent",
        "viewer",
        "student",
        "stock_manager",
      ],
      attendance_status: ["present", "absent", "late", "excused"],
      behavior_category: [
        "discipline",
        "respect",
        "attendance",
        "participation",
      ],
      school_term: ["term1", "term2", "term3"],
    },
  },
} as const
